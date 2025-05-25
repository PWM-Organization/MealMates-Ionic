import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonList,
  IonItem,
  IonThumbnail,
  IonLabel,
  IonChip,
  IonSpinner,
  IonAvatar,
  IonCard,
  IonCardContent,
  IonItemSliding,
  IonItemOption,
  IonItemOptions,
  IonFab,
  IonFabButton,
  RefresherCustomEvent,
  ToastController,
  AnimationController,
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { RecipeService } from '../../services/recipe.service';
import { SqliteService } from '../../services/sqlite.service';
import { Recipe } from '../../../models/recipe.model';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonList,
    IonItem,
    IonThumbnail,
    IonLabel,
    IonChip,
    IonSpinner,
    IonAvatar,
    IonCard,
    IonCardContent,
    IonItemSliding,
    IonItemOption,
    IonItemOptions,
    IonFab,
    IonFabButton,
  ],
  templateUrl: './favorites.page.html',
  styleUrls: ['./favorites.page.scss'],
})
export class FavoritesPage implements OnInit {
  private authService = inject(AuthService);
  private recipeService = inject(RecipeService);
  private sqliteService = inject(SqliteService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private animationCtrl = inject(AnimationController);

  allRecipes = signal<Recipe[]>([]);
  favoriteRecipeIds = signal<string[]>([]);
  isLoading = signal(true);
  isSqliteInitialized = signal(false);

  // Computed signals for reactive data
  currentUser = computed(() => this.authService.currentUser());
  userProfile = computed(() => this.authService.userProfile());
  favoriteRecipes = computed(() => {
    const recipes = this.allRecipes();
    const favoriteIds = this.favoriteRecipeIds();
    return recipes.filter((recipe) => favoriteIds.includes(recipe.id));
  });

  async ngOnInit() {
    // Wait for auth to load
    while (this.authService.isLoading()) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    try {
      // Intentar inicializar SQLite con más intentos para asegurar que funcione en el emulador
      console.log('Initializing SQLite for favorites page...');

      // Intentar inicializar varias veces en caso de fallo
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          await this.sqliteService.initializeDB();
          this.isSqliteInitialized.set(true);
          console.log('SQLite initialized successfully for favorites page');
          break;
        } catch (error) {
          attempts++;
          console.warn(`SQLite initialization attempt ${attempts} failed:`, error);

          if (attempts >= maxAttempts) {
            throw error;
          }

          // Esperar un poco antes de reintentar
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
      console.error('Error initializing SQLite after multiple attempts:', error);
      await this.showToast('Error initializing local database', 'alert-circle-outline');
    }

    await this.loadData();
  }

  async loadData() {
    try {
      this.isLoading.set(true);

      // Load all public recipes from Firestore
      const recipes = await this.recipeService.loadRecipes();
      this.allRecipes.set(recipes);

      // Load favorite IDs from SQLite
      const user = this.currentUser();
      if (user) {
        try {
          console.log('Loading favorites from SQLite...');
          // Intentar cargar favoritos, incluso si isSqliteInitialized es false
          // para asegurarnos de que se intente usar SQLite en el emulador
          const favoriteIds = await this.sqliteService.getFavorites(user.uid);
          console.log(`Loaded ${favoriteIds.length} favorites from SQLite`);
          this.favoriteRecipeIds.set(favoriteIds);
        } catch (error) {
          console.error('Error loading favorites from SQLite:', error);
          // Si falla, intentamos inicializar de nuevo
          if (!this.isSqliteInitialized()) {
            console.log('Attempting to reinitialize SQLite...');
            try {
              await this.sqliteService.initializeDB();
              this.isSqliteInitialized.set(true);
              // Intentar cargar favoritos de nuevo
              const favoriteIds = await this.sqliteService.getFavorites(user.uid);
              this.favoriteRecipeIds.set(favoriteIds);
            } catch (initError) {
              console.error('Failed to reinitialize SQLite:', initError);
              this.favoriteRecipeIds.set([]);
            }
          } else {
            this.favoriteRecipeIds.set([]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      await this.showToast('Error cargando datos', 'alert-circle-outline');
    } finally {
      this.isLoading.set(false);
    }
  }

  async handleRefresh(event: RefresherCustomEvent) {
    await this.loadData();
    event.target.complete();
  }

  goToRecipeDetail(recipe: Recipe) {
    this.router.navigate(['/recipe', recipe.id]);
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/landing']);
  }

  getUserDisplayName(user: User | null): string {
    if (!user) return 'Usuario';
    return user.firstName || user.lastName || 'Usuario';
  }

  async removeFavorite(recipe: Recipe) {
    try {
      const user = this.currentUser();
      if (!user) return;

      // Remove from SQLite
      await this.sqliteService.removeFavorite(recipe.id, user.uid);

      // Update local state
      const currentFavorites = this.favoriteRecipeIds();
      this.favoriteRecipeIds.set(currentFavorites.filter((id) => id !== recipe.id));

      await this.showToast('Receta eliminada de favoritos', 'heart-dislike');
    } catch (error) {
      console.error('Error removing favorite:', error);
      await this.showToast('Error al eliminar favorito', 'alert-circle-outline');
    }
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

  getDifficultyIcon(difficulty: string): string {
    switch (difficulty) {
      case 'easy':
        return 'cafe-outline';
      case 'medium':
        return 'flame-outline';
      case 'hard':
        return 'skull-outline';
      default:
        return 'help-outline';
    }
  }

  getAverageDifficulty(): string {
    const recipes = this.favoriteRecipes();
    if (recipes.length === 0) return 'medium';

    const difficultyMap = {
      easy: 1,
      medium: 2,
      hard: 3,
    };

    const difficultySum = recipes.reduce((sum, recipe) => {
      return sum + (difficultyMap[recipe.difficulty as keyof typeof difficultyMap] || 2);
    }, 0);

    const avgDifficulty = difficultySum / recipes.length;

    if (avgDifficulty < 1.5) return 'easy';
    if (avgDifficulty < 2.5) return 'medium';
    return 'hard';
  }

  getTotalCookingTime(): number {
    const recipes = this.favoriteRecipes();
    if (recipes.length === 0) return 0;

    return recipes.reduce((sum, recipe) => sum + recipe.cookingTime, 0);
  }

  trackByRecipeId(index: number, recipe: Recipe): string {
    return recipe.id;
  }

  goToExploreRecipes() {
    this.router.navigate(['/tabs/explore']);
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
