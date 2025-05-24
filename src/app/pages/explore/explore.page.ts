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
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  RefresherCustomEvent,
  ToastController,
  IonSkeletonText,
  IonSpinner,
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
    IonRefresher,
    IonRefresherContent,
    IonSearchbar,
    IonSkeletonText,
    IonSpinner,
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
  isLoadingMore = signal(false);
  hasError = signal(false);
  errorMessage = signal('');
  searchTerm = signal('');
  activeCategory = signal<RecipeCategory>('all');
  sqliteInitialized = signal(false);

  // Pagination state
  private readonly PAGE_SIZE = 12; // Smaller page size to reduce memory usage
  private currentPage = signal(0);
  private hasMoreData = signal(true);
  private lastDocumentSnapshot: any = null; // Store Firestore document snapshot for pagination
  private loadedImageUrls = new Set<string>(); // Track loaded images to prevent reloading

  // Derived state
  currentUser = computed(() => this.authService.currentUser());
  isSqliteAvailable = computed(() => this.sqliteService.isAvailable());
  hasRecipes = computed(() => this.filteredRecipes().length > 0);
  isEmpty = computed(() => !this.isLoading() && !this.hasRecipes());
  hasMoreRecipes = computed(() => this.hasMoreData() && !this.isLoading());

  async ngOnInit() {
    await this.loadData();
  }

  /**
   * Load initial recipe data with pagination
   */
  async loadData() {
    try {
      this.isLoading.set(true);
      this.hasError.set(false);
      this.errorMessage.set('');
      this.currentPage.set(0);
      this.hasMoreData.set(true);
      this.lastDocumentSnapshot = null;

      // Load initial batch of public recipes with limit
      const result = await this.recipeService.loadRecipesPaginated({
        isPublic: true,
        limit: this.PAGE_SIZE,
      });

      this.allRecipes.set(result.recipes);
      this.hasMoreData.set(result.hasMore);
      this.lastDocumentSnapshot = result.lastDoc;
      this.applyFilters();

      // Initialize SQLite in background (non-blocking)
      this.initializeSQLiteInBackground();

      // Load favorite IDs (with fallback)
      const user = this.currentUser();
      if (user) {
        try {
          const favoriteIds = await Promise.race([
            this.sqliteService.getFavorites(user.uid),
            new Promise<string[]>((resolve) => setTimeout(() => resolve([]), 1000)),
          ]);
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
      await this.showToast('Error cargando datos', 'alert-circle-outline');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Load more recipes for pagination
   */
  async loadMoreRecipes() {
    if (this.isLoadingMore() || !this.hasMoreData() || !this.lastDocumentSnapshot) {
      return;
    }

    try {
      this.isLoadingMore.set(true);

      // Load next batch using the last document as cursor
      const result = await this.recipeService.loadRecipesPaginated({
        isPublic: true,
        limit: this.PAGE_SIZE,
        startAfterDoc: this.lastDocumentSnapshot,
      });

      if (result.recipes.length > 0) {
        // Append new recipes to existing ones
        const allRecipes = [...this.allRecipes(), ...result.recipes];
        this.allRecipes.set(allRecipes);
        this.hasMoreData.set(result.hasMore);
        this.lastDocumentSnapshot = result.lastDoc;
        this.applyFilters();
      } else {
        this.hasMoreData.set(false);
      }
    } catch (error) {
      console.error('Error loading more recipes:', error);
      await this.showToast('Error cargando más recetas', 'alert-circle-outline');
    } finally {
      this.isLoadingMore.set(false);
    }
  }

  /**
   * Get optimized image URL with fallback
   */
  getOptimizedImageUrl(imageUrl?: string): string {
    if (!imageUrl) {
      return 'assets/icon/recipe-placeholder.svg';
    }

    // If it's a Firebase Storage URL, we can add size parameters
    if (imageUrl.includes('firebasestorage.googleapis.com')) {
      // Add optimization parameters for Firebase Storage
      const url = new URL(imageUrl);
      url.searchParams.set('alt', 'media');
      // Optimize for mobile display (max 400px width)
      url.searchParams.set('token', url.searchParams.get('token') || '');
      return url.toString();
    }

    return imageUrl;
  }

  /**
   * Handle image loading errors
   */
  onImageError(event: Event, recipe: Recipe) {
    const img = event.target as HTMLImageElement;
    if (img && !img.src.includes('recipe-placeholder.svg')) {
      console.warn(`Failed to load image for recipe ${recipe.id}:`, recipe.imageUrl);
      img.src = 'assets/icon/recipe-placeholder.svg';

      // Remove from loaded images cache if it was there
      if (recipe.imageUrl) {
        this.loadedImageUrls.delete(recipe.imageUrl);
      }
    }
  }

  /**
   * Handle successful image loading
   */
  onImageLoad(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img && img.src) {
      this.loadedImageUrls.add(img.src);
      // Optional: Add fade-in animation class
      img.classList.add('loaded');
    }
  }

  /**
   * Initialize SQLite in background without blocking UI
   */
  private async initializeSQLiteInBackground() {
    if (!this.sqliteService.isInitialized()) {
      try {
        // Don't await this - let it happen in background
        this.sqliteService
          .initializeDB()
          .then(() => {
            this.sqliteInitialized.set(true);
            // Reload favorites after SQLite is ready
            this.loadFavoritesAfterSQLiteInit();
          })
          .catch((error) => {
            console.warn('SQLite background initialization failed', error);
            this.sqliteInitialized.set(false);
          });
      } catch (error) {
        console.warn('Error starting SQLite background initialization', error);
        this.sqliteInitialized.set(false);
      }
    } else {
      this.sqliteInitialized.set(true);
    }
  }

  /**
   * Handle pull-to-refresh
   */
  async handleRefresh(event: RefresherCustomEvent) {
    try {
      // Reset pagination state
      this.currentPage.set(0);
      this.hasMoreData.set(true);
      this.lastDocumentSnapshot = null;
      this.loadedImageUrls.clear();
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
      await this.showToast('Debes iniciar sesión para guardar favoritos', 'alert-circle-outline');
      return;
    }

    try {
      // Check if SQLite is available - otherwise use localStorage fallback
      if (!this.isSqliteAvailable() && !this.sqliteService.isWebPlatform()) {
        await this.showToast(
          'La función de favoritos está disponible sólo en dispositivos móviles o después de instalar la app web',
          'information-circle-outline',
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
      await this.showToast('Error al actualizar favoritos', 'alert-circle-outline');

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
   * Load favorites after SQLite is initialized
   */
  private async loadFavoritesAfterSQLiteInit() {
    const user = this.currentUser();
    if (user && this.sqliteService.isInitialized()) {
      try {
        const favoriteIds = await this.sqliteService.getFavorites(user.uid);
        this.favoriteRecipeIds.set(favoriteIds);
      } catch (error) {
        console.warn('Error loading favorites after SQLite init', error);
      }
    }
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
