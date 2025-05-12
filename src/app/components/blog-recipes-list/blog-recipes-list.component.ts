import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { Recipe } from '../../../models/Recipe';

@Component({
  selector: 'app-blog-recipes-list',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './blog-recipes-list.component.html',
  styleUrls: ['./blog-recipes-list.component.css'],
})
export class BlogRecipesListComponent implements OnInit {
  blogRecipes: Recipe[] = [];
  loading = true;
  error = false;

  constructor(private firestore: Firestore) {}

  ngOnInit(): void {
    this.fetchRecipes();
  }

  async fetchRecipes(): Promise<void> {
    try {
      const recipesCollection = collection(this.firestore, 'recipes');
      const querySnapshot = await getDocs(recipesCollection);
      
      this.blogRecipes = querySnapshot.docs.map(doc => {
        const data = doc.data() as Recipe;
        return {
          id: doc.id,
          title: data.title,
          description: data.description,
          categories: data.categories || [],
          imageUrl: data.imageUrl, // Map imageUrl from Firebase to image for the template
          alt: data.alt || data.title,
          rate: data.rate || '0',
          chefName: data.chefName || 'Unknown Chef',
          chefImage: data.chefImage || 'https://picsum.photos/seed/default/30/30',
          time: data.time || 'N/A',
          difficulty: data.difficulty || 'Unknown',
          ingredients: data.ingredients || [],
          steps: data.steps || [],
          user_id: data.user_id || 'Anonymous'
        };
      });
      
      this.loading = false;
    } catch (error) {
      console.error('Error fetching recipes:', error);
      this.error = true;
      this.loading = false;
    }
  }
}
