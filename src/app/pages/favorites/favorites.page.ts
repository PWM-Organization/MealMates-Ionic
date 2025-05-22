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
  IonFab,
  IonFabButton,
  IonTabBar,
  IonTabButton,
  RefresherCustomEvent,
  ToastController,
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { RecipeService } from '../../services/recipe.service';
import { SqliteService } from '../../services/sqlite.service';
import { Recipe } from '../../../models/recipe.model';

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
    IonFab,
    IonFabButton,
    IonTabBar,
    IonTabButton,
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

  allRecipes = signal<Recipe[]>([]);
  favoriteRecipeIds = signal<string[]>([]);
  isLoading = signal(true);

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

    await this.sqliteService.initializeDB();
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
        const favoriteIds = await this.sqliteService.getFavorites(user.uid);
        this.favoriteRecipeIds.set(favoriteIds);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      await this.showToast('Error cargando datos', 'alert-circle');
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

  goToExploreRecipes() {
    this.router.navigate(['/explore']);
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
