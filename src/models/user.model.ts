import { Timestamp } from 'firebase/firestore';

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

export interface User {
  uid: string; // Same as Auth UID
  email: string;
  firstName: string;
  lastName: string;
  photoURL?: string;
  profileImageUrl?: string; // Firebase Storage URL for profile image
  bio?: string;
  phone?: string; // Phone number
  location?: string; // User location
  preferences: UserPreferences;
  dietaryRestrictions: string[];
  favoriteRecipes: string[]; // Array of recipe IDs
  savedRecipes: string[]; // Array of recipe IDs
  followersCount: number;
  followingCount: number;
  recipesCount: number;
  createdAt: Timestamp | Date;
  lastActiveAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
  isVerified: boolean;
  isPremium: boolean;
}

// Helper type for creating new users (without generated fields)
export type CreateUserData = Omit<
  User,
  'uid' | 'createdAt' | 'lastActiveAt' | 'updatedAt' | 'followersCount' | 'followingCount' | 'recipesCount'
>;

// Helper type for updating user profile
export type UpdateUserData = Partial<Omit<User, 'uid' | 'email' | 'createdAt'>>;

// User registration form data
export interface UserRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}
