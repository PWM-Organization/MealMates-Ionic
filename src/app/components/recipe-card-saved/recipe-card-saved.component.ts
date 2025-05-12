import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-recipe-card-saved',
  imports: [CommonModule, RouterModule],
  templateUrl: './recipe-card-saved.component.html',
  styleUrls: ['./recipe-card-saved.component.css',
    '../../pages/recipe/recipe.component.css',
    '../blog-recipes-list/blog-recipes-list.component.css',
    '../recipe-card-default/recipe-card-default.component.css',
    '../recipe-card-created/recipe-card-created.component.css',
    '../recipes-list/recipes-list.component.css',
    '../../../styles.css'
  ]
})
export class RecipeCardSavedComponent {
  @Input() recipe: any;

  trackByCategory(index: number, cat: string) {
  return cat;
}

}
