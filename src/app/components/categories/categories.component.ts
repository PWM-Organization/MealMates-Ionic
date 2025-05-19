import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss'
})
export class CategoriesComponent {
  categories = [
    {
      "id": "italian",
      "name": "Italiana",
      "count": 15,
      "isChecked": true
    },
    {
      "id": "mexican",
      "name": "Mexicana",
      "count": 12,
      "isChecked": false
    },
    {
      "id": "asian",
      "name": "Asiática",
      "count": 18,
      "isChecked": false
    },
    {
      "id": "vegetarian",
      "name": "Vegetariana",
      "count": 20,
      "isChecked": true
    },
    {
      "id": "fast-food",
      "name": "Fast Food",
      "count": 10,
      "isChecked": false
    },
    {
      "id": "desserts",
      "name": "Postres",
      "count": 8,
      "isChecked": true
    }
  ];
   trackById(index: number, category: any) {
    return category.id;
  }
}

