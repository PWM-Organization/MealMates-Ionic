export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  cookingTime: number; // en minutos
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: RecipeCategory;
  tags: string[];
  authorId: string;
  imageUrl: string;
  nutritionInfo?: NutritionInfo;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  likes: number;
  saves: number;
  rating?: number;
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  optional?: boolean;
}

export interface NutritionInfo {
  calories: number;
  protein: number; // gramos
  carbs: number; // gramos
  fat: number; // gramos
  fiber?: number; // gramos
}

export type RecipeCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert' | 'beverage' | 'appetizer';
