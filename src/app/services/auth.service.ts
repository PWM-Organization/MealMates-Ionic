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
import { Observable, from } from 'rxjs';
import { auth, firestore } from '../firebase.config';
import { User, CreateUserData, UserPreferences } from '../../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSignal = signal<FirebaseUser | null>(null);
  private userProfileSignal = signal<User | null>(null);
  private loadingSignal = signal(false);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly userProfile = this.userProfileSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly isLoading = this.loadingSignal.asReadonly();

  constructor() {
    onAuthStateChanged(auth, async (user) => {
      this.currentUserSignal.set(user);
      if (user) {
        await this.loadUserProfile(user.uid);
      } else {
        this.userProfileSignal.set(null);
      }
    });
  }

  async register(email: string, password: string, userData: CreateUserData): Promise<void> {
    this.loadingSignal.set(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);

      // Actualizar el perfil de Firebase Auth
      await updateProfile(credential.user, {
        displayName: `${userData.firstName} ${userData.lastName}`,
      });

      // Crear perfil de usuario en Firestore
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

      const user: Omit<User, 'createdAt' | 'updatedAt' | 'lastActiveAt'> & {
        createdAt: any;
        updatedAt: any;
        lastActiveAt: any;
      } = {
        id: credential.user.uid,
        email: credential.user.email!,
        firstName: userData.firstName,
        lastName: userData.lastName,
        displayName: `${userData.firstName} ${userData.lastName}`,
        preferences: defaultPreferences,
        dietaryRestrictions: [],
        favoriteRecipes: [],
        savedRecipes: [],
        followersCount: 0,
        followingCount: 0,
        recipesCount: 0,
        isVerified: false,
        isPremium: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
      };

      await setDoc(doc(firestore, 'users', credential.user.uid), user);

      // Cargar el perfil creado
      await this.loadUserProfile(credential.user.uid);
    } catch (error) {
      console.error('Error during registration:', error);
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async login(email: string, password: string): Promise<void> {
    this.loadingSignal.set(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);

      // Actualizar última actividad
      const user = auth.currentUser;
      if (user) {
        await this.updateLastActivity(user.uid);
      }
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async logout(): Promise<void> {
    this.loadingSignal.set(true);
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  private async loadUserProfile(uid: string): Promise<void> {
    try {
      const userDoc = await getDoc(doc(firestore, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Convertir timestamps a dates
        const user: User = {
          ...userData,
          createdAt: userData['createdAt']?.toDate() || new Date(),
          updatedAt: userData['updatedAt']?.toDate() || new Date(),
          lastActiveAt: userData['lastActiveAt']?.toDate() || new Date(),
        } as User;
        this.userProfileSignal.set(user);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  private async updateLastActivity(uid: string): Promise<void> {
    try {
      await updateDoc(doc(firestore, 'users', uid), {
        lastActiveAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating last activity:', error);
    }
  }

  // Método para actualizar el perfil del usuario
  async updateUserProfile(updates: Partial<User>): Promise<void> {
    const user = this.currentUser();
    if (!user) throw new Error('User not authenticated');

    try {
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      await this.loadUserProfile(user.uid);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Observable para compatibilidad con componentes existentes
  get authState$(): Observable<FirebaseUser | null> {
    return new Observable((subscriber) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        subscriber.next(user);
      });
      return unsubscribe;
    });
  }
}
