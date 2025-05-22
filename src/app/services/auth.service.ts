import { Injectable, signal, computed, inject } from '@angular/core';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, firestore } from '../../firebase.config';
import { User, UserRegistrationData, UserPreferences } from '../../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSignal = signal<FirebaseUser | null>(null);
  private userProfileSignal = signal<User | null>(null);
  private isLoadingSignal = signal(true);

  // Public readonly signals
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly userProfile = this.userProfileSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUser());

  constructor() {
    // Initialize auth state listener
    onAuthStateChanged(auth, async (user) => {
      this.currentUserSignal.set(user);
      this.isLoadingSignal.set(true);

      if (user) {
        await this.loadUserProfile(user.uid);
      } else {
        this.userProfileSignal.set(null);
      }

      this.isLoadingSignal.set(false);
    });
  }

  /**
   * Register a new user with email/password and create their profile
   */
  async register(email: string, password: string, userData: UserRegistrationData): Promise<void> {
    try {
      // Create Firebase Auth user
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = credential.user;

      // Update Firebase Auth profile
      await updateProfile(firebaseUser, {
        displayName: `${userData.firstName} ${userData.lastName}`,
      });

      // Create default user preferences
      const defaultPreferences: UserPreferences = {
        defaultServings: 4,
        measurementSystem: 'metric',
        skillLevel: 'beginner',
        cookingTime: 'any',
        notifications: {
          newRecipes: true,
          weeklyPlanner: true,
          social: true,
        },
      };

      // Create user profile in Firestore
      const userProfile: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: `${userData.firstName} ${userData.lastName}`,
        firstName: userData.firstName,
        lastName: userData.lastName,
        preferences: defaultPreferences,
        dietaryRestrictions: [],
        favoriteRecipes: [],
        savedRecipes: [],
        followersCount: 0,
        followingCount: 0,
        recipesCount: 0,
        createdAt: serverTimestamp() as Timestamp,
        lastActiveAt: serverTimestamp() as Timestamp,
        isVerified: false,
        isPremium: false,
      };

      await setDoc(doc(firestore, 'users', firebaseUser.uid), userProfile);
      this.userProfileSignal.set(userProfile);
    } catch (error) {
      console.error('Error during registration:', error);
      throw error;
    }
  }

  /**
   * Sign in user with email and password
   */
  async login(email: string, password: string): Promise<void> {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle the rest
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  }

  /**
   * Sign out current user
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
      // onAuthStateChanged will handle clearing state
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  }

  /**
   * Load user profile from Firestore
   */
  private async loadUserProfile(uid: string): Promise<void> {
    try {
      const userDoc = await getDoc(doc(firestore, 'users', uid));

      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        this.userProfileSignal.set(userData);

        // Update last active timestamp
        await updateDoc(doc(firestore, 'users', uid), {
          lastActiveAt: serverTimestamp(),
        });
      } else {
        console.warn('User profile not found in Firestore');
        this.userProfileSignal.set(null);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      this.userProfileSignal.set(null);
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<void> {
    const user = this.currentUser();
    if (!user) throw new Error('User not authenticated');

    try {
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, {
        preferences: {
          ...this.userProfile()?.preferences,
          ...preferences,
        },
        updatedAt: serverTimestamp(),
      });

      // Update local state
      const currentProfile = this.userProfile();
      if (currentProfile) {
        this.userProfileSignal.set({
          ...currentProfile,
          preferences: {
            ...currentProfile.preferences,
            ...preferences,
          },
        });
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }

  /**
   * Update user profile information
   */
  async updateProfile(updates: Partial<User>): Promise<void> {
    const user = this.currentUser();
    if (!user) throw new Error('User not authenticated');

    try {
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      // Update Firebase Auth profile if displayName changed
      if (updates.displayName) {
        await updateProfile(user, {
          displayName: updates.displayName,
        });
      }

      // Update local state
      const currentProfile = this.userProfile();
      if (currentProfile) {
        this.userProfileSignal.set({
          ...currentProfile,
          ...updates,
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }
}
