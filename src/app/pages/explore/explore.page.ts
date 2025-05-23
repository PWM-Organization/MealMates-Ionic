import { Component, OnInit, signal, computed, inject, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonLabel,
  RefresherCustomEvent,
  ToastController,
  IonSkeletonText,
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { RecipeService } from '../../services/recipe.service';
import { SqliteService } from '../../services/sqlite.service';
import { Recipe } from '../../../models/recipe.model';

type RecipeCategory = 'all' | 'breakfast' | 'lunch' | 'dinner' | 'dessert' | 'snack' | 'beverage';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonIcon,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    IonSearchbar,
    IonTabBar,
    IonTabButton,
    IonTabs,
    IonLabel,
    IonSkeletonText,
  ],
  templateUrl: './explore.page.html',
  styleUrls: ['./explore.page.scss'],
})
export class ExplorePage implements OnInit {
  @ViewChild(IonContent) content!: IonContent;

  private authService = inject(AuthService);
  private recipeService = inject(RecipeService);
  private sqliteService = inject(SqliteService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);

  // State signals
  allRecipes = signal<Recipe[]>([]);
  filteredRecipes = signal<Recipe[]>([]);
  favoriteRecipeIds = signal<string[]>([]);
  isLoading = signal(true);
  hasError = signal(false);
  errorMessage = signal('');
  searchTerm = signal('');
  activeCategory = signal<RecipeCategory>('all');

  // Derived state
  currentUser = computed(() => this.authService.currentUser());
  isSqliteAvailable = computed(() => this.sqliteService.isAvailable());
  hasRecipes = computed(() => this.filteredRecipes().length > 0);
  isEmpty = computed(() => !this.isLoading() && !this.hasRecipes());

  async ngOnInit() {
    await this.loadData();
  }

  /**
   * Load all recipe and favorite data
   */
  async loadData() {
    try {
      this.isLoading.set(true);
      this.hasError.set(false);
      this.errorMessage.set('');

      // 1. Load all public recipes from Firestore
      const recipes = await this.recipeService.loadRecipes();
      this.allRecipes.set(recipes);
      this.applyFilters();

      // 2. Initialize SQLite (with fallback)
      if (!this.sqliteService.isInitialized()) {
        try {
          await this.sqliteService.initializeDB();
        } catch (error) {
          console.warn('SQLite initialization skipped in web mode - using fallback');
        }
      }

      // 3. Load favorite IDs (with fallback)
      const user = this.currentUser();
      if (user) {
        try {
          const favoriteIds = await this.sqliteService.getFavorites(user.uid);
          this.favoriteRecipeIds.set(favoriteIds);
        } catch (error) {
          console.warn('Error loading favorites - using empty list', error);
          this.favoriteRecipeIds.set([]);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      this.hasError.set(true);
      this.errorMessage.set('Error al cargar las recetas. Intenta de nuevo.');
      await this.showToast('Error cargando datos', 'alert-circle');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Handle pull-to-refresh
   */
  async handleRefresh(event: RefresherCustomEvent) {
    try {
      await this.loadData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      event.target.complete();
    }
  }

  /**
   * Handle search input change
   */
  onSearchChange(event: any) {
    const searchTerm = event.detail.value.toLowerCase().trim();
    this.searchTerm.set(searchTerm);
    this.applyFilters();

    // Scroll to top when changing search
    this.scrollToTop();
  }

  /**
   * Filter recipes by category
   */
  filterByCategory(category: RecipeCategory) {
    this.activeCategory.set(category);
    this.applyFilters();

    // Scroll to top when changing category
    this.scrollToTop();
  }

  /**
   * Apply all current filters to the recipe list
   */
  applyFilters() {
    let filtered = [...this.allRecipes()];
    const searchTerm = this.searchTerm();
    const category = this.activeCategory();

    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(
        (recipe) =>
          recipe.title.toLowerCase().includes(searchTerm) ||
          (recipe.description && recipe.description.toLowerCase().includes(searchTerm)) ||
          recipe.category.toLowerCase().includes(searchTerm) ||
          (recipe.tags && recipe.tags.some((tag) => tag.toLowerCase().includes(searchTerm))),
      );
    }

    // Apply category filter
    if (category !== 'all') {
      filtered = filtered.filter((recipe) => recipe.category === category);
    }

    this.filteredRecipes.set(filtered);
  }

  /**
   * Reset all filters to defaults
   */
  resetFilters() {
    this.searchTerm.set('');
    this.activeCategory.set('all');
    this.filteredRecipes.set(this.allRecipes());
    this.scrollToTop();
  }

  /**
   * Toggle favorite status with better error handling
   */
  async toggleFavorite(recipe: Recipe, event: Event) {
    event.stopPropagation();
    event.preventDefault();

    // Require authentication
    const user = this.currentUser();
    if (!user) {
      await this.showToast('Debes iniciar sesión para guardar favoritos', 'alert-circle');
      return;
    }

    try {
      // Check if SQLite is available - otherwise use localStorage fallback
      if (!this.isSqliteAvailable() && !this.sqliteService.isWebPlatform()) {
        await this.showToast(
          'La función de favoritos está disponible sólo en dispositivos móviles o después de instalar la app web',
          'information-circle',
        );
        return;
      }

      // Optimistic UI update - update UI immediately for better UX
      const isFav = this.isFavorite(recipe.id);
      const currentFavorites = this.favoriteRecipeIds();

      if (isFav) {
        this.favoriteRecipeIds.set(currentFavorites.filter((id) => id !== recipe.id));
      } else {
        this.favoriteRecipeIds.set([...currentFavorites, recipe.id]);
      }

      // Update in storage (SQLite or localStorage)
      const newStatus = await this.sqliteService.toggleFavorite(recipe.id, user.uid);

      // Show minimal feedback tooltip
      const message = newStatus ? 'Agregado a favoritos' : 'Eliminado de favoritos';
      const icon = newStatus ? 'heart' : 'heart-dislike';
      await this.showToast(message, icon);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      await this.showToast('Error al actualizar favoritos', 'alert-circle');

      // Revert to original state on error
      await this.loadData();
    }
  }

  /**
   * Check if a recipe is in favorites
   */
  isFavorite(recipeId: string): boolean {
    return this.favoriteRecipeIds().includes(recipeId);
  }

  /**
   * Navigate to recipe detail
   */
  goToRecipeDetail(recipe: Recipe) {
    this.router.navigate(['/recipe', recipe.id]);
  }

  /**
   * Get color based on difficulty
   */
  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'easy':
        return 'success';
      case 'medium':
        return 'warning';
      case 'hard':
        return 'danger';
      default:
        return 'medium';
    }
  }

  /**
   * Track recipes by ID for better change detection
   */
  trackByRecipeId(index: number, recipe: Recipe): string {
    return recipe.id;
  }

  /**
   * Scroll content to top smoothly
   */
  private scrollToTop() {
    if (this.content) {
      this.content.scrollToTop(300);
    }
  }

  /**
   * Show toast message
   */
  private async showToast(message: string, icon: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom',
      icon,
      color: 'dark',
      cssClass: 'custom-toast',
    });

    await toast.present();
  }
}
