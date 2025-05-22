export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  profileImageUrl?: string;
  bio?: string;
  preferences: UserPreferences;
  dietaryRestrictions: string[];
  favoriteRecipes: string[];
  savedRecipes: string[];
  followersCount: number;
  followingCount: number;
  recipesCount: number;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
  isVerified: boolean;
  isPremium: boolean;
}

export interface UserPreferences {
  defaultServings: number;
  measurementSystem: 'metric' | 'imperial';
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  cookingTime: 'quick' | 'medium' | 'long' | 'any';
  notifications: {
    newRecipes: boolean;
    weeklyPlanner: boolean;
    social: boolean;
  };
}

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
}
