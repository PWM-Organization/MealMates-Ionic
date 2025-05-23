import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonThumbnail,
  IonLabel,
  IonChip,
  IonButton,
  IonIcon,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonButtons,
  IonBackButton,
  IonTabBar,
  IonTabButton,
  IonTabs,
  RefresherCustomEvent,
  ToastController,
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
    IonList,
    IonItem,
    IonThumbnail,
    IonLabel,
    IonChip,
    IonButton,
    IonIcon,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    IonSearchbar,
    IonButtons,
    IonBackButton,
    IonTabBar,
    IonTabButton,
    IonTabs,
  ],
  templateUrl: './explore.page.html',
  styleUrls: ['./explore.page.scss'],
})
export class ExplorePage implements OnInit {
  private authService = inject(AuthService);
  private recipeService = inject(RecipeService);
  private sqliteService = inject(SqliteService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);

  allRecipes = signal<Recipe[]>([]);
  filteredRecipes = signal<Recipe[]>([]);
  favoriteRecipeIds = signal<string[]>([]);
  isLoading = signal(true);
  searchTerm = signal('');
  activeCategory = signal<RecipeCategory>('all');

  currentUser = computed(() => this.authService.currentUser());

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    try {
      this.isLoading.set(true);

      // Load all public recipes from Firestore
      const recipes = await this.recipeService.loadRecipes();
      this.allRecipes.set(recipes);
      this.applyFilters();

      // Load favorite IDs from SQLite
      const user = this.currentUser();
      if (user) {
        await this.sqliteService.initializeDB();
        const favoriteIds = await this.sqliteService.getFavorites(user.uid);
        this.favoriteRecipeIds.set(favoriteIds);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      await this.showToast('Error cargando recetas', 'alert-circle');
    } finally {
      this.isLoading.set(false);
    }
  }

  async handleRefresh(event: RefresherCustomEvent) {
    await this.loadData();
    event.target.complete();
  }

  onSearchChange(event: any) {
    const searchTerm = event.detail.value.toLowerCase();
    this.searchTerm.set(searchTerm);
    this.applyFilters();
  }

  filterByCategory(category: RecipeCategory) {
    this.activeCategory.set(category);
    this.applyFilters();
  }

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
          recipe.category.toLowerCase().includes(searchTerm),
      );
    }

    // Apply category filter
    if (category !== 'all') {
      filtered = filtered.filter((recipe) => recipe.category === category);
    }

    this.filteredRecipes.set(filtered);
  }

  resetFilters() {
    this.searchTerm.set('');
    this.activeCategory.set('all');
    this.filteredRecipes.set(this.allRecipes());
  }

  async toggleFavorite(recipe: Recipe, event: Event) {
    event.stopPropagation();

    const user = this.currentUser();
    if (!user) {
      await this.showToast('Debes iniciar sesión para guardar favoritos', 'alert-circle');
      return;
    }

    try {
      const newStatus = await this.sqliteService.toggleFavorite(recipe.id, user.uid);

      // Update local favorites list
      const currentFavorites = this.favoriteRecipeIds();
      if (newStatus) {
        this.favoriteRecipeIds.set([...currentFavorites, recipe.id]);
      } else {
        this.favoriteRecipeIds.set(currentFavorites.filter((id) => id !== recipe.id));
      }

      const message = newStatus ? 'Receta agregada a favoritos' : 'Receta eliminada de favoritos';
      const icon = newStatus ? 'heart' : 'heart-dislike';
      await this.showToast(message, icon);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      await this.showToast('Error al actualizar favoritos', 'alert-circle');
    }
  }

  isFavorite(recipeId: string): boolean {
    return this.favoriteRecipeIds().includes(recipeId);
  }

  goToRecipeDetail(recipe: Recipe) {
    this.router.navigate(['/recipe', recipe.id]);
  }

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

  trackByRecipeId(index: number, recipe: Recipe): string {
    return recipe.id;
  }

  private async showToast(message: string, icon: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom',
      icon,
      color: 'primary',
    });
    await toast.present();
  }
}
