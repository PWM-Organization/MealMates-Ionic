import { Injectable, signal, computed } from '@angular/core';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { firestore } from '../firebase.config';
import { Recipe } from '../../models/recipe.model';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RecipeService {
  private recipesSignal = signal<Recipe[]>([]);
  private loadingSignal = signal(false);
  private featuredRecipesSignal = signal<Recipe[]>([]);

  readonly recipes = this.recipesSignal.asReadonly();
  readonly featuredRecipes = this.featuredRecipesSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();

  constructor() {
    this.loadFeaturedRecipes();
  }

  async loadRecipes(): Promise<Recipe[]> {
    this.loadingSignal.set(true);
    try {
      const recipesQuery = query(
        collection(firestore, 'recipes'),
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc'),
      );

      const snapshot = await getDocs(recipesQuery);
      const recipes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()['createdAt']?.toDate() || new Date(),
        updatedAt: doc.data()['updatedAt']?.toDate() || new Date(),
      })) as Recipe[];

      this.recipesSignal.set(recipes);
      return recipes;
    } catch (error) {
      console.error('Error loading recipes:', error);
      return [];
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async loadFeaturedRecipes(): Promise<Recipe[]> {
    this.loadingSignal.set(true);
    try {
      const recipesQuery = query(
        collection(firestore, 'recipes'),
        where('isPublic', '==', true),
        orderBy('likes', 'desc'),
        limit(6),
      );

      const snapshot = await getDocs(recipesQuery);
      const recipes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()['createdAt']?.toDate() || new Date(),
        updatedAt: doc.data()['updatedAt']?.toDate() || new Date(),
      })) as Recipe[];

      this.featuredRecipesSignal.set(recipes);
      return recipes;
    } catch (error) {
      console.error('Error loading featured recipes:', error);
      // Si hay error, cargar recetas de ejemplo
      await this.createSampleRecipes();
      return [];
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async getRecipeById(id: string): Promise<Recipe | null> {
    try {
      const docRef = doc(firestore, 'recipes', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data()['createdAt']?.toDate() || new Date(),
          updatedAt: docSnap.data()['updatedAt']?.toDate() || new Date(),
        } as Recipe;
      }
      return null;
    } catch (error) {
      console.error('Error getting recipe:', error);
      return null;
    }
  }

  async getRecipesByCategory(category: string): Promise<Recipe[]> {
    this.loadingSignal.set(true);
    try {
      const recipesQuery = query(
        collection(firestore, 'recipes'),
        where('isPublic', '==', true),
        where('category', '==', category),
        orderBy('createdAt', 'desc'),
        limit(10),
      );

      const snapshot = await getDocs(recipesQuery);
      const recipes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()['createdAt']?.toDate() || new Date(),
        updatedAt: doc.data()['updatedAt']?.toDate() || new Date(),
      })) as Recipe[];

      return recipes;
    } catch (error) {
      console.error('Error loading recipes by category:', error);
      return [];
    } finally {
      this.loadingSignal.set(false);
    }
  }

  // Crear recetas de ejemplo para demostración
  async createSampleRecipes(): Promise<void> {
    const sampleRecipes = [
      {
        title: 'Paella Valenciana',
        description: 'La auténtica paella valenciana con pollo, conejo y garrofón',
        ingredients: [
          { name: 'Arroz bomba', amount: 400, unit: 'g' },
          { name: 'Pollo', amount: 1, unit: 'unidad' },
          { name: 'Conejo', amount: 500, unit: 'g' },
          { name: 'Garrofón', amount: 200, unit: 'g' },
          { name: 'Tomate rallado', amount: 2, unit: 'cucharadas' },
          { name: 'Pimentón dulce', amount: 1, unit: 'cucharadita' },
          { name: 'Azafrán', amount: 1, unit: 'pizca' },
        ],
        instructions: [
          'Calentar aceite en la paellera',
          'Sofreír el pollo y el conejo hasta dorar',
          'Añadir las verduras y sofreír',
          'Incorporar el tomate y pimentón',
          'Añadir el arroz y remover',
          'Verter el caldo caliente con azafrán',
          'Cocinar a fuego fuerte 10 minutos',
          'Reducir el fuego y cocinar 15 minutos más',
        ],
        cookingTime: 45,
        servings: 6,
        difficulty: 'medium' as const,
        category: 'lunch' as const,
        tags: ['español', 'arroz', 'tradicional'],
        authorId: 'demo-chef',
        imageUrl: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=400&h=300&fit=crop',
        isPublic: true,
        likes: 127,
        saves: 89,
        rating: 4.7,
        nutritionInfo: {
          calories: 420,
          protein: 28,
          carbs: 45,
          fat: 12,
          fiber: 3,
        },
      },
      {
        title: 'Pasta Carbonara',
        description: 'Cremosa pasta carbonara italiana con pancetta y huevo',
        ingredients: [
          { name: 'Espaguetis', amount: 400, unit: 'g' },
          { name: 'Pancetta', amount: 150, unit: 'g' },
          { name: 'Huevos', amount: 4, unit: 'unidades' },
          { name: 'Queso pecorino', amount: 100, unit: 'g' },
          { name: 'Pimienta negra', amount: 1, unit: 'cucharadita' },
        ],
        instructions: [
          'Hervir agua con sal para la pasta',
          'Cortar la pancetta en cubitos',
          'Batir huevos con queso y pimienta',
          'Cocinar la pancetta hasta dorar',
          'Escurrir pasta al dente',
          'Mezclar pasta caliente con huevos',
          'Añadir pancetta y su grasa',
          'Servir inmediatamente',
        ],
        cookingTime: 20,
        servings: 4,
        difficulty: 'easy' as const,
        category: 'dinner' as const,
        tags: ['italiano', 'pasta', 'rápido'],
        authorId: 'demo-chef',
        imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=300&fit=crop',
        isPublic: true,
        likes: 245,
        saves: 156,
        rating: 4.9,
        nutritionInfo: {
          calories: 580,
          protein: 24,
          carbs: 72,
          fat: 20,
          fiber: 3,
        },
      },
      {
        title: 'Smoothie Bowl Tropical',
        description: 'Bowl nutritivo con frutas tropicales y superalimentos',
        ingredients: [
          { name: 'Plátano congelado', amount: 2, unit: 'unidades' },
          { name: 'Mango', amount: 1, unit: 'unidad' },
          { name: 'Leche de coco', amount: 200, unit: 'ml' },
          { name: 'Granola', amount: 50, unit: 'g' },
          { name: 'Coco rallado', amount: 2, unit: 'cucharadas' },
          { name: 'Semillas de chía', amount: 1, unit: 'cucharada' },
        ],
        instructions: [
          'Congelar las frutas la noche anterior',
          'Licuar plátano y mango con leche de coco',
          'Verter en un bowl',
          'Decorar con granola, coco y chía',
          'Añadir frutas frescas al gusto',
          'Servir inmediatamente',
        ],
        cookingTime: 10,
        servings: 2,
        difficulty: 'easy' as const,
        category: 'breakfast' as const,
        tags: ['saludable', 'tropical', 'vegano'],
        authorId: 'demo-chef',
        imageUrl: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=400&h=300&fit=crop',
        isPublic: true,
        likes: 189,
        saves: 203,
        rating: 4.6,
        nutritionInfo: {
          calories: 320,
          protein: 8,
          carbs: 45,
          fat: 14,
          fiber: 8,
        },
      },
      {
        title: 'Tacos de Pescado',
        description: 'Tacos frescos con pescado a la plancha y salsa de mango',
        ingredients: [
          { name: 'Pescado blanco', amount: 400, unit: 'g' },
          { name: 'Tortillas de maíz', amount: 8, unit: 'unidades' },
          { name: 'Mango', amount: 1, unit: 'unidad' },
          { name: 'Cebolla morada', amount: 0.5, unit: 'unidad' },
          { name: 'Lima', amount: 2, unit: 'unidades' },
          { name: 'Cilantro', amount: 1, unit: 'manojo' },
        ],
        instructions: [
          'Marinar el pescado con lima y especias',
          'Cortar mango y cebolla en cubitos',
          'Hacer salsa mezclando mango, cebolla y cilantro',
          'Cocinar pescado a la plancha',
          'Calentar tortillas',
          'Armar tacos con pescado y salsa',
          'Decorar con cilantro y lima',
        ],
        cookingTime: 25,
        servings: 4,
        difficulty: 'easy' as const,
        category: 'lunch' as const,
        tags: ['mexicano', 'pescado', 'fresco'],
        authorId: 'demo-chef',
        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
        isPublic: true,
        likes: 167,
        saves: 134,
        rating: 4.5,
        nutritionInfo: {
          calories: 290,
          protein: 25,
          carbs: 32,
          fat: 8,
          fiber: 5,
        },
      },
      {
        title: 'Brownie de Chocolate',
        description: 'Brownies fudgy de chocolate con nueces',
        ingredients: [
          { name: 'Chocolate negro', amount: 200, unit: 'g' },
          { name: 'Mantequilla', amount: 150, unit: 'g' },
          { name: 'Azúcar', amount: 200, unit: 'g' },
          { name: 'Huevos', amount: 3, unit: 'unidades' },
          { name: 'Harina', amount: 100, unit: 'g' },
          { name: 'Nueces', amount: 100, unit: 'g' },
        ],
        instructions: [
          'Precalentar horno a 180°C',
          'Derretir chocolate con mantequilla',
          'Batir huevos con azúcar',
          'Mezclar chocolate derretido con huevos',
          'Incorporar harina tamizada',
          'Añadir nueces troceadas',
          'Hornear 25-30 minutos',
          'Dejar enfriar antes de cortar',
        ],
        cookingTime: 40,
        servings: 12,
        difficulty: 'easy' as const,
        category: 'dessert' as const,
        tags: ['chocolate', 'postre', 'horneado'],
        authorId: 'demo-chef',
        imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop',
        isPublic: true,
        likes: 298,
        saves: 245,
        rating: 4.8,
        nutritionInfo: {
          calories: 285,
          protein: 4,
          carbs: 32,
          fat: 16,
          fiber: 2,
        },
      },
      {
        title: 'Ensalada César',
        description: 'Clásica ensalada César con pollo a la parrilla',
        ingredients: [
          { name: 'Lechuga romana', amount: 2, unit: 'unidades' },
          { name: 'Pechuga de pollo', amount: 300, unit: 'g' },
          { name: 'Pan', amount: 100, unit: 'g' },
          { name: 'Queso parmesano', amount: 80, unit: 'g' },
          { name: 'Mayonesa', amount: 100, unit: 'ml' },
          { name: 'Ajo', amount: 2, unit: 'dientes' },
        ],
        instructions: [
          'Asar el pollo a la parrilla',
          'Hacer croutons con el pan',
          'Preparar aderezo César',
          'Lavar y cortar la lechuga',
          'Mezclar lechuga con aderezo',
          'Añadir pollo en tiras',
          'Decorar con croutons y parmesano',
        ],
        cookingTime: 30,
        servings: 4,
        difficulty: 'medium' as const,
        category: 'lunch' as const,
        tags: ['ensalada', 'pollo', 'clásico'],
        authorId: 'demo-chef',
        imageUrl: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop',
        isPublic: true,
        likes: 156,
        saves: 112,
        rating: 4.4,
        nutritionInfo: {
          calories: 380,
          protein: 28,
          carbs: 15,
          fat: 25,
          fiber: 4,
        },
      },
    ];

    try {
      // Crear las recetas de ejemplo
      for (const recipe of sampleRecipes) {
        await addDoc(collection(firestore, 'recipes'), {
          ...recipe,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      // Recargar las recetas destacadas
      await this.loadFeaturedRecipes();
    } catch (error) {
      console.error('Error creating sample recipes:', error);
    }
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'easy':
        return 'success';
      case 'medium':
        return 'warning';
      case 'hard':
        return 'danger';
      default:
        return 'medium';
    }
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'breakfast':
        return 'sunny';
      case 'lunch':
        return 'restaurant';
      case 'dinner':
        return 'moon';
      case 'snack':
        return 'fast-food';
      case 'dessert':
        return 'ice-cream';
      case 'beverage':
        return 'wine';
      case 'appetizer':
        return 'leaf';
      default:
        return 'restaurant';
    }
  }
}
