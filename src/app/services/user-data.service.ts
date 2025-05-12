import { Injectable, inject } from '@angular/core';
import { Firestore, doc, docData, setDoc, updateDoc, DocumentReference } from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { UserProfile } from '../../models/UserProfile';

@Injectable({
    providedIn: 'root',
})
export class UserDataService {
    private firestore: Firestore = inject(Firestore);
    private authService: AuthService = inject(AuthService);

    // Observable para obtener el perfil del usuario actual
    readonly currentUserProfile$: Observable<UserProfile | null> = this.authService.authState$.pipe(
        switchMap((user) => {
            if (user) {
                // Si hay usuario, obtenemos su documento de perfil
                const profileDocRef = doc(this.firestore, `users/${user.uid}`) as DocumentReference<UserProfile>; // Especificamos el tipo
                // Usamos docData y mapeamos undefined a null
                return docData<UserProfile>(profileDocRef).pipe(
                    map((profileData) => profileData ?? null), // Si profileData es undefined, devuelve null
                );
            } else {
                // Si no hay usuario, emitimos null
                return of(null);
            }
        }),
    );

    // Obtener el perfil de un usuario por UID (como Promise para una sola lectura)
    getUserProfile(uid: string): Observable<UserProfile | undefined> {
        const profileDocRef = doc(this.firestore, `users/${uid}`) as DocumentReference<UserProfile>;
        return docData<UserProfile>(profileDocRef);
    }

    // Crear o actualizar el perfil del usuario (ej. al registrar o guardar cambios)
    // Usamos setDoc con merge: true para crear si no existe o actualizar si existe.
    updateUserProfile(profileData: Partial<UserProfile>): Observable<void> {
        return this.authService.authState$.pipe(
            switchMap((user) => {
                if (!user) {
                    throw new Error('User not logged in!');
                }
                const profileDocRef = doc(this.firestore, `users/${user.uid}`);
                // Usamos Partial<UserProfile> porque podríamos actualizar solo algunos campos
                // Usamos setDoc con merge:true para no sobrescribir campos no incluidos
                return from(setDoc(profileDocRef, profileData, { merge: true }));
            }),
        );
    }

    // Método específico para actualizar solo ciertos campos si se prefiere
    updateSpecificProfileFields(
        uid: string,
        data: { displayName?: string; description?: string; photoURL?: string },
    ): Promise<void> {
        const profileDocRef = doc(this.firestore, `users/${uid}`);
        return updateDoc(profileDocRef, data);
    }
}
