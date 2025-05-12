import { Injectable, inject } from '@angular/core';
import {
    Auth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    authState,
} from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private auth: Auth = inject(Auth);
    readonly authState$: Observable<any | null> = authState(this.auth);

    register({ email, password }: any) {
        return createUserWithEmailAndPassword(this.auth, email, password);
    }

    login({ email, password }: any) {
        return signInWithEmailAndPassword(this.auth, email, password);
    }

    logout() {
        return signOut(this.auth);
    }
}
