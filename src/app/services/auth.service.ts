import { Injectable, inject, signal, computed } from '@angular/core';
import { auth } from '../../firebase.config';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  AuthError,
  AuthErrorCodes,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { firestore } from '../../firebase.config';
import { User, UserRegistrationData, UserPreferences } from '../../models/user.model';

@Injectable({
  providedIn: 'root',
})
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
    auth.onAuthStateChanged(async (user) => {
      this.currentUserSignal.set(user);
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
  async register(userData: UserRegistrationData): Promise<void> {
    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);

      // Update Firebase Auth profile
      await updateProfile(userCredential.user, {
        displayName: `${userData.firstName} ${userData.lastName}`,
      });

      // Create user profile in Firestore
      const userProfile: User = {
        uid: userCredential.user.uid,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        photoURL: userCredential.user.photoURL || '',
        createdAt: Timestamp.now(),
        lastActiveAt: Timestamp.now(),
        isVerified: false,
        isPremium: false,
        followersCount: 0,
        followingCount: 0,
        recipesCount: 0,
        favoriteRecipes: [],
        savedRecipes: [],
        dietaryRestrictions: [],
        preferences: {
          defaultServings: 4,
          measurementSystem: 'metric',
          skillLevel: 'beginner',
          cookingTime: 'any',
          notifications: {
            newRecipes: true,
            weeklyPlanner: true,
            social: true,
          },
        },
      };

      await setDoc(doc(firestore, 'users', userCredential.user.uid), {
        ...userProfile,
        createdAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
      });
      this.userProfileSignal.set(userProfile);
    } catch (error: any) {
      console.error('Error during registration:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign in user with email and password
   */
  async login(email: string, password: string): Promise<void> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await this.loadUserProfile(userCredential.user.uid);
    } catch (error: any) {
      console.error('Error during login:', error);
      throw this.handleAuthError(error);
    }
  }

  /**
   * Sign out current user
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
      this.userProfileSignal.set(null);
    } catch (error: any) {
      console.error('Error during logout:', error);
      throw this.handleAuthError(error);
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
      if (updates.firstName || updates.lastName) {
        await updateProfile(user, {
          displayName: `${updates.firstName} ${updates.lastName}`,
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

  /**
   * Handle Firebase Auth errors and return user-friendly messages
   */
  private handleAuthError(error: AuthError): Error {
    console.error('Auth error:', error);
    let message = 'Ha ocurrido un error. Por favor intenta de nuevo.';

    switch (error.code) {
      case AuthErrorCodes.EMAIL_EXISTS:
        message = 'Este email ya está registrado.';
        break;
      case AuthErrorCodes.INVALID_EMAIL:
        message = 'El email no es válido.';
        break;
      case AuthErrorCodes.WEAK_PASSWORD:
        message = 'La contraseña debe tener al menos 6 caracteres.';
        break;
      case AuthErrorCodes.USER_DELETED:
        message = 'No existe una cuenta con este email.';
        break;
      case AuthErrorCodes.INVALID_PASSWORD:
        message = 'La contraseña es incorrecta.';
        break;
      case AuthErrorCodes.TOO_MANY_ATTEMPTS_TRY_LATER:
        message = 'Demasiados intentos fallidos. Por favor intenta más tarde.';
        break;
    }

    return new Error(message);
  }

  /**
   * Update user profile with form data
   */
  async updateUserProfile(updates: Partial<User>): Promise<void> {
    const user = this.currentUser();
    if (!user) throw new Error('No authenticated user');

    const userRef = doc(firestore, 'users', user.uid);

    // Create a clean updates object without undefined values
    const profileUpdates: Record<string, any> = {};
    Object.keys(updates).forEach((key) => {
      const value = updates[key as keyof Partial<User>];
      if (value !== undefined) {
        profileUpdates[key] = value;
      }
    });

    // Add updatedAt timestamp
    profileUpdates['updatedAt'] = serverTimestamp();

    // Update Firebase Auth profile if name changes
    if (updates.firstName || updates.lastName) {
      const firstName = updates.firstName || this.userProfile()?.firstName || '';
      const lastName = updates.lastName || this.userProfile()?.lastName || '';
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`,
      });
    }

    // Update photoURL if provided
    if (profileUpdates['photoURL']) {
      await updateProfile(user, {
        photoURL: profileUpdates['photoURL'],
      });
    }

    // Update Firestore document
    await updateDoc(userRef, profileUpdates);

    // Update local state
    const currentProfile = this.userProfile();
    if (currentProfile) {
      this.userProfileSignal.set({
        ...currentProfile,
        ...profileUpdates,
        // Convert serverTimestamp to regular Timestamp for local state
        updatedAt: profileUpdates['updatedAt'] === serverTimestamp() ? Timestamp.now() : profileUpdates['updatedAt'],
      });
    }
  }

  /**
   * Update user profile cache without writing to Firestore
   * Used when we already have fresh data from Firestore
   */
  updateUserProfileCache(userData: User): void {
    this.userProfileSignal.set(userData);
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }
}
