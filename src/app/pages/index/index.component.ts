import { Component, OnInit, signal, inject, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule, IonModal } from '@ionic/angular';
import { RecipeService } from '../../services/recipe.service';
import { Recipe } from '../../../models/recipe.model';

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss'],
})
export class IndexComponent implements OnInit {
  @ViewChild('recipeModal', { static: false }) recipeModal!: IonModal;

  private router = inject(Router);
  private recipeService = inject(RecipeService);

  featuredRecipes = this.recipeService.featuredRecipes;
  isLoading = this.recipeService.isLoading;
  selectedRecipe = signal<Recipe | null>(null);

  // Datos para el hero section
  heroFeatures = [
    {
      icon: 'restaurant',
      title: 'Recetas Increíbles',
      description: 'Miles de recetas de todo el mundo',
    },
    {
      icon: 'people',
      title: 'Comunidad',
      description: 'Comparte y descubre con otros chefs',
    },
    {
      icon: 'heart',
      title: 'Favoritos',
      description: 'Guarda tus recetas preferidas',
    },
  ];

  // Categorías populares
  popularCategories = [
    { name: 'Desayuno', icon: 'sunny', color: 'warning', category: 'breakfast' },
    { name: 'Almuerzo', icon: 'restaurant', color: 'primary', category: 'lunch' },
    { name: 'Cena', icon: 'moon', color: 'secondary', category: 'dinner' },
    { name: 'Postres', icon: 'ice-cream', color: 'tertiary', category: 'dessert' },
  ];

  ngOnInit() {
    // Las recetas se cargan automáticamente desde el servicio
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  openRecipeModal(recipe: Recipe) {
    this.selectedRecipe.set(recipe);
    this.recipeModal.present();
  }

  closeRecipeModal() {
    this.recipeModal.dismiss();
    this.selectedRecipe.set(null);
  }

  getDifficultyColor(difficulty: string): string {
    return this.recipeService.getDifficultyColor(difficulty);
  }

  getCategoryIcon(category: string): string {
    return this.recipeService.getCategoryIcon(category);
  }

  // Método para manejar slides en el carrusel
  onSlideChange() {
    // Aquí puedes agregar lógica adicional si necesitas
  }

  // Método para refrescar contenido
  async handleRefresh(event: any) {
    await this.recipeService.loadFeaturedRecipes();
    event.target.complete();
  }
}
