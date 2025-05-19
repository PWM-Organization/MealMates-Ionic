import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  standalone: true,
  selector: 'app-recipe-card-saved',
  imports: [CommonModule, RouterModule, IonicModule],
  templateUrl: './recipe-card-saved.component.html',
  styleUrls: ['./recipe-card-saved.component.scss',
    '../../pages/recipe/recipe.component.scss',
    '../blog-recipes-list/blog-recipes-list.component.scss',
    '../recipe-card-default/recipe-card-default.component.scss',
    '../recipe-card-created/recipe-card-created.component.scss',
    '../recipes-list/recipes-list.component.scss',
    '../../../global.scss'
  ]
})
export class RecipeCardSavedComponent {
  @Input() recipe: any;

  trackByCategory(index: number, cat: string) {
  return cat;
}

}
