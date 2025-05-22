import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonChip,
  IonList,
  IonItem,
  IonCheckbox,
  IonLabel,
  IonSpinner,
  IonFab,
  IonFabButton,
  IonGrid,
  IonRow,
  IonCol,
  ToastController,
  AlertController,
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { RecipeService } from '../../services/recipe.service';
import { SqliteService } from '../../services/sqlite.service';
import { Recipe, Ingredient } from '../../../models/recipe.model';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonChip,
    IonList,
    IonItem,
    IonCheckbox,
    IonLabel,
    IonSpinner,
    IonFab,
    IonFabButton,
    IonGrid,
    IonRow,
    IonCol,
  ],
  templateUrl: './recipe-detail.page.html',
  styleUrls: ['./recipe-detail.page.scss'],
})
export class RecipeDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private recipeService = inject(RecipeService);
  private sqliteService = inject(SqliteService);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);

  recipe = signal<Recipe | null>(null);
  isFavorite = signal(false);
  isLoading = signal(true);
  checkedIngredients = signal<boolean[]>([]);

  currentUser = computed(() => this.authService.currentUser());

  async ngOnInit() {
    const recipeId = this.route.snapshot.paramMap.get('id');
    if (recipeId) {
      await this.loadRecipe(recipeId);
      await this.checkFavoriteStatus(recipeId);
    } else {
      this.router.navigate(['/favorites']);
    }
  }

  private async loadRecipe(id: string) {
    try {
      this.isLoading.set(true);
      const recipe = await this.recipeService.getRecipeById(id);

      if (recipe) {
        this.recipe.set(recipe);
        // Initialize ingredients checklist
        const ingredientCount = Array.isArray(recipe.ingredients)
          ? recipe.ingredients.length
          : (recipe.ingredients as any).length || 0;
        this.checkedIngredients.set(new Array(ingredientCount).fill(false));
      } else {
        await this.showAlert('Error', 'Receta no encontrada');
        this.router.navigate(['/favorites']);
      }
    } catch (error) {
      console.error('Error loading recipe:', error);
      await this.showAlert('Error', 'Error cargando la receta');
      this.router.navigate(['/favorites']);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async checkFavoriteStatus(recipeId: string) {
    const user = this.currentUser();
    if (user) {
      try {
        const isFav = await this.sqliteService.isFavorite(recipeId, user.uid);
        this.isFavorite.set(isFav);
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    }
  }

  async toggleFavorite() {
    const user = this.currentUser();
    const recipe = this.recipe();

    if (!user) {
      await this.showToast('Debes iniciar sesión para guardar favoritos', 'alert-circle');
      return;
    }

    if (!recipe) return;

    try {
      const newStatus = await this.sqliteService.toggleFavorite(recipe.id, user.uid);
      this.isFavorite.set(newStatus);

      const message = newStatus ? 'Receta agregada a favoritos' : 'Receta eliminada de favoritos';
      const icon = newStatus ? 'heart' : 'heart-dislike';

      await this.showToast(message, icon);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      await this.showToast('Error al actualizar favoritos', 'alert-circle');
    }
  }

  toggleIngredientCheck(index: number) {
    const current = this.checkedIngredients();
    current[index] = !current[index];
    this.checkedIngredients.set([...current]);
  }

  goBack() {
    this.router.navigate(['/favorites']);
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

  getCategoryColor(category: string): string {
    switch (category) {
      case 'breakfast':
        return 'warning';
      case 'lunch':
        return 'primary';
      case 'dinner':
        return 'secondary';
      case 'snack':
        return 'tertiary';
      case 'dessert':
        return 'success';
      case 'beverage':
        return 'medium';
      default:
        return 'primary';
    }
  }

  // Helper to handle ingredients - could be string[] or Ingredient[]
  getIngredientText(ingredient: any): string {
    if (typeof ingredient === 'string') {
      return ingredient;
    }
    // If it's an Ingredient object
    if (ingredient.name && ingredient.amount && ingredient.unit) {
      return `${ingredient.amount} ${ingredient.unit} ${ingredient.name}`;
    }
    return ingredient.name || ingredient.toString();
  }

  isIngredientOptional(ingredient: any): boolean {
    return typeof ingredient === 'object' && ingredient.optional === true;
  }

  async shareRecipe() {
    const recipe = this.recipe();
    if (!recipe) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: recipe?.description || 'Deliciosa receta de MealMates',
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback - copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        await this.showToast('Enlace copiado al portapapeles', 'copy');
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
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

  private async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
