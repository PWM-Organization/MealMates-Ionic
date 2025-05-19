import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  standalone: true,
  selector: 'app-recipe-card-created',
  imports: [CommonModule, RouterModule, IonicModule],
  templateUrl: './recipe-card-created.component.html',
  styleUrls: ['./recipe-card-created.component.scss',
    '../../pages/recipe/recipe.component.css',
    '../blog-recipes-list/blog-recipes-list.component.scss',
    '../recipe-card-default/recipe-card-default.component.scss',
    '../recipe-card-saved/recipe-card-saved.component.css',
    '../recipes-list/recipes-list.component.css',
    '../../../global.scss'
  ]
})
export class RecipeCardCreatedComponent {
  @Input() recipe: any;

  trackByCategory(index: number, cat: string): string {
    return cat;
  }
}
