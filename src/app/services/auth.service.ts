import { Injectable, signal, computed } from '@angular/core';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '../../firebase.config';
import { User } from '../../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSignal = signal<FirebaseUser | null>(null);
  private userProfileSignal = signal<User | null>(null);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly userProfile = this.userProfileSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUser());

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

  async register(
    email: string,
    password: string,
    userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<void> {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user: User = {
      id: credential.user.uid,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(doc(firestore, 'users', credential.user.uid), user);
    this.userProfileSignal.set(user);
  }

  async login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }

  private async loadUserProfile(uid: string): Promise<void> {
    const userDoc = await getDoc(doc(firestore, 'users', uid));
    if (userDoc.exists()) {
      this.userProfileSignal.set(userDoc.data() as User);
    }
  }
}
