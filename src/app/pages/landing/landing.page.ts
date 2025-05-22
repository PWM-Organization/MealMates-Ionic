import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonItem,
  IonLabel,
  IonText,
  IonChip,
  IonGrid,
  IonRow,
  IonCol,
  IonImg,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/angular/standalone';
import { RecipeService } from '../../services/recipe.service';
import { Recipe } from '../../../models/recipe.model';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonButton,
    IonIcon,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonItem,
    IonLabel,
    IonText,
    IonChip,
    IonGrid,
    IonRow,
    IonCol,
    IonImg,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
  ],
  templateUrl: './landing.page.html',
  styleUrls: ['./landing.page.scss'],
})
export class LandingPage implements OnInit {
  private router = inject(Router);
  private recipeService = inject(RecipeService);

  featuredRecipes = signal<Recipe[]>([]);
  isLoading = signal(true);

  async ngOnInit() {
    await this.loadFeaturedRecipes();
  }

  async loadFeaturedRecipes() {
    try {
      this.isLoading.set(true);
      const recipes = await this.recipeService.loadRecipes();
      // Tomar las primeras 5 recetas como destacadas
      this.featuredRecipes.set(recipes.slice(0, 5));
    } catch (error) {
      console.error('Error loading featured recipes:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async handleRefresh(event: any) {
    await this.loadFeaturedRecipes();
    event.target.complete();
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  viewRecipe(recipeId: string) {
    // Si no está logueado, redirigir a login
    this.router.navigate(['/login']);
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
}
