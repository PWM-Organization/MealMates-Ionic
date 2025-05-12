import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, Subscription, switchMap, tap } from 'rxjs';
import { User } from '@angular/fire/auth'; // Importar User si es necesario tipar

import { AuthService } from '../../services/auth.service';
import { UserDataService } from '../../services/user-data.service';
import { StorageService } from '../../services/storage.service';
import { UserProfile } from '../../../models/UserProfile';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [RouterModule, CommonModule, ReactiveFormsModule], // Añadir ReactiveFormsModule
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
    // Inyectar servicios
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private userDataService = inject(UserDataService);
    private storageService = inject(StorageService);

    // Estado del componente
    currentUser: User | null = null; // Para mostrar el email
    profile$: Observable<UserProfile | null> = this.userDataService.currentUserProfile$;
    isLoading = false;
    uploadingImage = false;
    saveSuccess = false;
    saveError: string | null = null;
    uploadError: string | null = null;

    // Formulario para los datos editables
    profileForm = this.fb.group({
        displayName: ['', Validators.maxLength(50)],
        description: ['', Validators.maxLength(200)],
    });

    private profileSubscription: Subscription | null = null;

    ngOnInit(): void {
        // Obtener el usuario autenticado para el email
        this.authService.authState$.subscribe((user) => {
            this.currentUser = user;
        });

        // Suscribirse al perfil y actualizar el formulario cuando lleguen los datos
        this.profileSubscription = this.profile$
            .pipe(
                tap((profile) => {
                    if (profile) {
                        // Actualizamos los valores del formulario SIN emitir evento para no marcar como dirty
                        this.profileForm.patchValue(
                            {
                                displayName: profile.displayName,
                                description: profile.description,
                            },
                            { emitEvent: false },
                        );
                    }
                }),
            )
            .subscribe();
    }

    ngOnDestroy(): void {
        // Desuscribirse para evitar fugas de memoria
        this.profileSubscription?.unsubscribe();
    }

    // Guardar cambios del formulario (nombre y descripción)
    saveProfile(): void {
        if (this.profileForm.invalid || !this.currentUser) {
            return;
        }
        this.isLoading = true;
        this.saveSuccess = false;
        this.saveError = null;

        const profileData: Partial<UserProfile> = {
            uid: this.currentUser.uid,
            displayName: this.profileForm.value.displayName,
            description: this.profileForm.value.description,
            // No incluimos email ni photoURL aquí, se manejan por separado
        };

        this.userDataService.updateUserProfile(profileData).subscribe({
            next: () => {
                this.isLoading = false;
                this.saveSuccess = true;
                this.profileForm.markAsPristine(); // Marcar como no modificado
                setTimeout(() => (this.saveSuccess = false), 3000); // Ocultar mensaje después de 3s
            },
            error: (err) => {
                this.isLoading = false;
                this.saveError = 'Error al guardar el perfil. Inténtalo de nuevo.';
                console.error('Error saving profile:', err);
            },
        });
    }

    // Manejar selección de archivo de imagen
    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0] && this.currentUser) {
            const file = input.files[0];
            this.uploadProfilePicture(file);
        }
    }

    // Subir imagen y actualizar URL en Firestore
    uploadProfilePicture(file: File): void {
        if (!this.currentUser) return;

        this.uploadingImage = true;
        this.uploadError = null;
        const currentUid = this.currentUser.uid; // Guardamos uid por si currentUser cambia

        this.storageService
            .uploadProfileImage(file)
            .pipe(
                // Una vez obtenida la URL de descarga, la guardamos en el perfil de Firestore
                switchMap((downloadURL) => {
                    return this.userDataService.updateUserProfile({ uid: currentUid, photoURL: downloadURL });
                }),
            )
            .subscribe({
                next: () => {
                    this.uploadingImage = false;
                    console.log('Profile picture updated successfully!');
                    // El observable profile$ debería actualizarse automáticamente con la nueva URL
                },
                error: (err) => {
                    this.uploadingImage = false;
                    this.uploadError = 'Error al subir la imagen. Inténtalo de nuevo.';
                    console.error('Error uploading image or updating profile:', err);
                },
            });
    }

    // Eliminamos el método logout obsoleto y el EventEmitter
    // La lógica de logout está en HeaderComponent
}
