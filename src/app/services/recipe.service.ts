import { Injectable, signal } from '@angular/core';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { firestore } from '../../firebase.config';
import { Recipe } from '../../models/recipe.model';

@Injectable({ providedIn: 'root' })
export class RecipeService {
  private recipesSignal = signal<Recipe[]>([]);
  readonly recipes = this.recipesSignal.asReadonly();

  async loadRecipes(): Promise<Recipe[]> {
    const recipesQuery = query(
      collection(firestore, 'recipes'),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc'),
    );

    const snapshot = await getDocs(recipesQuery);
    const recipes = snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Recipe),
    );

    this.recipesSignal.set(recipes);
    return recipes;
  }

  async getRecipeById(id: string): Promise<Recipe | null> {
    const docRef = doc(firestore, 'recipes', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Recipe;
    }
    return null;
  }
}
