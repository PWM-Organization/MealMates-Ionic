import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-recipe-card-default',
  imports: [
    CommonModule, 
    RouterModule
  ],
  templateUrl: './recipe-card-default.component.html',
  styleUrls: ['./recipe-card-default.component.css',
    '../blog-recipes-list/blog-recipes-list.component.css',
    '../recipe-card-default/recipe-card-default.component.css',
    '../recipe-card-saved/recipe-card-saved.component.css',
    '../recipes-list/recipes-list.component.css',
    '../../../styles.css'
  ]
})
export class RecipeCardDefaultComponent {
  @Input() recipe: any;

  trackByCategory(index: number, cat: string) {
  return cat;
}

}
