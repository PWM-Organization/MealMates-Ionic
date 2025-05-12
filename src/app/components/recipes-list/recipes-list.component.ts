import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RecipeCardCreatedComponent } from '../recipe-card-created/recipe-card-created.component';
import { RecipeCardDefaultComponent } from '../recipe-card-default/recipe-card-default.component';
import { RecipeCardSavedComponent } from '../recipe-card-saved/recipe-card-saved.component';

@Component({
  selector: 'app-recipes-list',
  standalone: true,
  imports: [RouterModule, CommonModule, RecipeCardCreatedComponent, RecipeCardDefaultComponent, RecipeCardSavedComponent],
  templateUrl: './recipes-list.component.html',
  styleUrls: ['./recipes-list.component.css']
})
export class RecipesListComponent {
  @Input() recipeType = 1;

  trackRecipe(index: number, recipe: any) {
    return recipe.id;
  }
  
  recipes = [
    {
      "id": "1",
      "option": "created",
      "title": "Pasta Primavera PRUEBA",
      "time": "30 min",
      "difficulty": "Fácil",
      "categories": ["Vegetariana", "Pasta", "Italiana"],
      "image": "https://nutriendotuvida.com/img/8b89b70ce4540c4c223195d6e14ba0fc.png",
      "alt": "Pasta Primavera"
    },
    {
      "id": "2",
      "option": "created",
      "title": "Salmón al Horno",
      "time": "25 min",
      "difficulty": "Medio",
      "categories": ["Pescado", "Saludable", "Sin Gluten"],
      "image": "https://www.annarecetasfaciles.com/files/salmon-horno-1024x576.jpg",
      "alt": "Salmón al Horno"
    },
    {
      "id": "3",
      "option": "created",
      "title": "Curry de Garbanzos",
      "time": "40 min",
      "difficulty": "Medio",
      "categories": ["Vegana", "India", "Especiada"],
      "image": "https://recetasdecocina.elmundo.es/wp-content/uploads/2024/09/curry-de-garbanzos.jpg",
      "alt": "Curry de Garbanzos"
    },
    {
      "id": "4",
      "option": "created",
      "title": "Pollo al Limón",
      "time": "35 min",
      "difficulty": "Fácil",
      "categories": ["Pollo", "Bajo en Calorías", "Mediterránea"],
      "image": "https://polloseldorado.co/wp-content/uploads/2023/09/pollo-al-limon-portada.jpg",
      "alt": "Pollo al Limón"
    },
    {
      "id": "10",
      "option": "saved",
      "title": "Arroz 3 delicias",
      "time": "50 min",
      "difficulty": "Medio",
      "categories": ["Arroces", "Chino"],
      "image": "https://comedera.com/wp-content/uploads/sites/9/2014/03/arroz-tres-delicias.jpg?w=1200",
      "alt": "Arroz 3 delicias"
    },
    {
      "id": "11",
      "option": "saved",
      "title": "Sandwich mixto",
      "time": "5 min",
      "difficulty": "Fácil",
      "categories": ["Desayuno", "Rápido"],
      "image": "https://i.pinimg.com/736x/ec/a8/54/eca854f94b97902686a36fe34397c523.jpg",
      "alt": "Sandwich mixto"
    }
  ]
}
