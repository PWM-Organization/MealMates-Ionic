import { Injectable, signal, inject } from '@angular/core';
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
  limit,
  serverTimestamp,
  Timestamp,
  startAfter,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { firestore } from '../../firebase.config';
import { Recipe, RecipeFilters, CreateRecipeData, UpdateRecipeData } from '../../models/recipe.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class RecipeService {
  private authService = inject(AuthService);

  private recipesSignal = signal<Recipe[]>([]);
  private isLoadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);

  // Public readonly signals
  readonly recipes = this.recipesSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  /**
   * Load recipes with optional filters
   */
  async loadRecipes(filters: RecipeFilters = {}): Promise<Recipe[]> {
    try {
      this.isLoadingSignal.set(true);
      this.errorSignal.set(null);

      let q = query(collection(firestore, 'recipes'));

      // For public recipes, use simpler approach to avoid composite index requirements
      if (filters.isPublic !== undefined) {
        // Order by createdAt first, then filter client-side
        q = query(q, orderBy('createdAt', 'desc'));
      } else {
        // Apply other filters normally
        if (filters.category) {
          q = query(q, where('category', '==', filters.category));
        }

        if (filters.difficulty) {
          q = query(q, where('difficulty', '==', filters.difficulty));
        }

        if (filters.maxCookingTime) {
          q = query(q, where('cookingTime', '<=', filters.maxCookingTime));
        }

        if (filters.authorId) {
          q = query(q, where('authorId', '==', filters.authorId));
        }

        if (filters.tags && filters.tags.length > 0) {
          q = query(q, where('tags', 'array-contains-any', filters.tags));
        }

        // Default ordering by creation date
        q = query(q, orderBy('createdAt', 'desc'));
      }

      // Add pagination cursor if provided
      if (filters.startAfterDoc) {
        q = query(q, startAfter(filters.startAfterDoc));
      }

      // Apply limit
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }

      const snapshot = await getDocs(q);
      let recipeDocs = snapshot.docs;

      // Client-side filtering for public recipes if needed
      if (filters.isPublic !== undefined) {
        recipeDocs = recipeDocs.filter((doc) => {
          const data = doc.data();
          return data['isPublic'] === filters.isPublic;
        });
      }

      const recipes = recipeDocs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Recipe),
      );

      this.recipesSignal.set(recipes);
      return recipes;
    } catch (error) {
      console.error('Error loading recipes:', error);
      this.errorSignal.set('Error cargando recetas');
      throw error;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Load recipes with pagination support (returns both recipes and last document for pagination)
   */
  async loadRecipesPaginated(filters: RecipeFilters = {}): Promise<{
    recipes: Recipe[];
    lastDoc: QueryDocumentSnapshot | null;
    hasMore: boolean;
  }> {
    try {
      this.isLoadingSignal.set(true);
      this.errorSignal.set(null);

      let q = query(collection(firestore, 'recipes'));

      // For public recipes, we'll use a simpler approach to avoid composite index requirements
      // We'll order by createdAt first, then filter client-side if needed
      if (filters.isPublic !== undefined) {
        // If we're specifically looking for public recipes, order by createdAt directly
        // and filter client-side to avoid composite index requirements
        q = query(q, orderBy('createdAt', 'desc'));
      } else {
        // Apply other filters normally
        if (filters.category) {
          q = query(q, where('category', '==', filters.category));
        }

        if (filters.difficulty) {
          q = query(q, where('difficulty', '==', filters.difficulty));
        }

        if (filters.maxCookingTime) {
          q = query(q, where('cookingTime', '<=', filters.maxCookingTime));
        }

        if (filters.authorId) {
          q = query(q, where('authorId', '==', filters.authorId));
        }

        if (filters.tags && filters.tags.length > 0) {
          q = query(q, where('tags', 'array-contains-any', filters.tags));
        }

        // Default ordering by creation date
        q = query(q, orderBy('createdAt', 'desc'));
      }

      // Add pagination cursor if provided
      if (filters.startAfterDoc) {
        q = query(q, startAfter(filters.startAfterDoc));
      }

      // Apply limit (add extra to check if there are more results)
      const pageSize = filters.limit || 20;
      // For public recipes, load more to account for client-side filtering
      const queryLimit = filters.isPublic ? pageSize * 2 : pageSize + 1;
      q = query(q, limit(queryLimit));

      const snapshot = await getDocs(q);
      let allDocs = snapshot.docs;

      // Client-side filtering for public recipes if needed
      if (filters.isPublic !== undefined) {
        allDocs = allDocs.filter((doc) => {
          const data = doc.data();
          return data['isPublic'] === filters.isPublic;
        });
      }

      // Check if there are more results
      const hasMore = allDocs.length > pageSize;
      const recipeDocs = hasMore ? allDocs.slice(0, pageSize) : allDocs;

      const recipes = recipeDocs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Recipe),
      );

      const lastDoc = recipeDocs.length > 0 ? recipeDocs[recipeDocs.length - 1] : null;

      return { recipes, lastDoc, hasMore };
    } catch (error) {
      console.error('Error loading recipes with pagination:', error);
      this.errorSignal.set('Error cargando recetas');
      throw error;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Get a specific recipe by ID
   */
  async getRecipeById(id: string): Promise<Recipe | null> {
    try {
      this.errorSignal.set(null);

      const docRef = doc(firestore, 'recipes', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as Recipe;
      }

      return null;
    } catch (error) {
      console.error('Error getting recipe:', error);
      this.errorSignal.set('Error obteniendo receta');
      throw error;
    }
  }

  /**
   * Create a new recipe
   */
  async createRecipe(recipeData: CreateRecipeData): Promise<string> {
    const user = this.authService.currentUser();
    if (!user) throw new Error('User not authenticated');

    try {
      this.errorSignal.set(null);

      const newRecipe = {
        ...recipeData,
        authorId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likes: 0,
        saves: 0,
      };

      const docRef = await addDoc(collection(firestore, 'recipes'), newRecipe);

      // Reload recipes to update local state
      await this.loadRecipes({ isPublic: true });

      return docRef.id;
    } catch (error) {
      console.error('Error creating recipe:', error);
      this.errorSignal.set('Error creando receta');
      throw error;
    }
  }

  /**
   * Update an existing recipe
   */
  async updateRecipe(id: string, updates: UpdateRecipeData): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) throw new Error('User not authenticated');

    try {
      this.errorSignal.set(null);

      // Check if user is the author
      const recipe = await this.getRecipeById(id);
      if (!recipe) throw new Error('Recipe not found');
      if (recipe.authorId !== user.uid) throw new Error('Not authorized to update this recipe');

      const recipeRef = doc(firestore, 'recipes', id);
      await updateDoc(recipeRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      // Update local state
      const currentRecipes = this.recipes();
      const updatedRecipes = currentRecipes.map((recipe) => (recipe.id === id ? { ...recipe, ...updates } : recipe));
      this.recipesSignal.set(updatedRecipes);
    } catch (error) {
      console.error('Error updating recipe:', error);
      this.errorSignal.set('Error actualizando receta');
      throw error;
    }
  }

  /**
   * Delete a recipe
   */
  async deleteRecipe(id: string): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) throw new Error('User not authenticated');

    try {
      this.errorSignal.set(null);

      // Check if user is the author
      const recipe = await this.getRecipeById(id);
      if (!recipe) throw new Error('Recipe not found');
      if (recipe.authorId !== user.uid) throw new Error('Not authorized to delete this recipe');

      await deleteDoc(doc(firestore, 'recipes', id));

      // Update local state
      const currentRecipes = this.recipes();
      const filteredRecipes = currentRecipes.filter((recipe) => recipe.id !== id);
      this.recipesSignal.set(filteredRecipes);
    } catch (error) {
      console.error('Error deleting recipe:', error);
      this.errorSignal.set('Error eliminando receta');
      throw error;
    }
  }

  /**
   * Search recipes by title or description
   */
  async searchRecipes(searchTerm: string): Promise<Recipe[]> {
    try {
      this.isLoadingSignal.set(true);
      this.errorSignal.set(null);

      // Firestore doesn't have full-text search, so we'll load all public recipes
      // and filter on the client side. For production, consider using Algolia or similar.
      const q = query(collection(firestore, 'recipes'), where('isPublic', '==', true), orderBy('createdAt', 'desc'));

      const snapshot = await getDocs(q);
      const allRecipes = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Recipe),
      );

      // Client-side filtering
      const searchTermLower = searchTerm.toLowerCase();
      const filteredRecipes = allRecipes.filter(
        (recipe) =>
          recipe.title.toLowerCase().includes(searchTermLower) ||
          recipe?.description?.toLowerCase().includes(searchTermLower) ||
          recipe.tags.some((tag) => tag.toLowerCase().includes(searchTermLower)),
      );

      return filteredRecipes;
    } catch (error) {
      console.error('Error searching recipes:', error);
      this.errorSignal.set('Error buscando recetas');
      throw error;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Get recipes by category
   */
  async getRecipesByCategory(category: string): Promise<Recipe[]> {
    return this.loadRecipes({ category: category as any, isPublic: true });
  }

  /**
   * Get user's own recipes
   */
  async getUserRecipes(): Promise<Recipe[]> {
    const user = this.authService.currentUser();
    if (!user) throw new Error('User not authenticated');

    return this.loadRecipes({ authorId: user.uid });
  }

  /**
   * Toggle like on a recipe
   */
  async toggleLike(recipeId: string): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) throw new Error('User not authenticated');

    try {
      const recipe = await this.getRecipeById(recipeId);
      if (!recipe) throw new Error('Recipe not found');

      // For now, just increment/decrement likes
      // In a real app, you'd track individual user likes
      const newLikes = Math.max(0, recipe.likes + (Math.random() > 0.5 ? 1 : -1));

      await this.updateRecipe(recipeId, { likes: newLikes });
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }

  /**
   * Clear local state
   */
  clearRecipes(): void {
    this.recipesSignal.set([]);
    this.errorSignal.set(null);
  }
}
