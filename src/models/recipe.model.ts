import { Timestamp } from 'firebase/firestore';

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  optional?: boolean;
}

export interface NutritionInfo {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber?: number; // grams
}

export type RecipeCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert' | 'beverage';

export interface Recipe {
  id: string; // Auto-generated document ID
  title: string; // Recipe name
  description?: string; // Short description
  ingredients: Ingredient[]; // List of ingredients
  instructions: string[]; // Step-by-step instructions
  cookingTime: number; // Time in minutes
  servings: number; // Number of servings
  difficulty: 'easy' | 'medium' | 'hard';
  category: RecipeCategory; // Main category
  tags: string[]; // Additional tags
  authorId: string; // Reference to user who created
  imageUrl?: string; // Firebase Storage URL
  nutritionInfo?: NutritionInfo;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  isPublic: boolean; // Visibility setting
  likes: number; // Like count
  saves: number; // Save count
}

// Helper type for creating new recipes (without generated fields)
export type CreateRecipeData = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'saves'>;

// Helper type for updating recipes
export type UpdateRecipeData = Partial<Omit<Recipe, 'id' | 'createdAt' | 'authorId'>>;

// Filters for recipe queries
export interface RecipeFilters {
  category?: RecipeCategory;
  difficulty?: 'easy' | 'medium' | 'hard';
  maxCookingTime?: number;
  tags?: string[];
  authorId?: string;
  isPublic?: boolean;
  limit?: number;
}
