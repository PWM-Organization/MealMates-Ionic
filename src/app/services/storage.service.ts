import { Injectable, inject } from '@angular/core';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { AuthService } from './auth.service';
import { Observable, from, switchMap, of } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class StorageService {
    private storage: Storage = inject(Storage);
    private authService: AuthService = inject(AuthService);

    /**
     * Sube una imagen al Storage y devuelve un Observable con la URL de descarga.
     * La imagen se guarda en una ruta específica del usuario (ej: profile_images/[uid]/profile.jpg)
     * @param file El archivo de imagen a subir.
     * @returns Observable<string> que emite la URL de descarga.
     */
    uploadProfileImage(file: File): Observable<string> {
        return this.authService.authState$.pipe(
            switchMap((user) => {
                if (!user) {
                    throw new Error('User not logged in for image upload!');
                }
                // Definimos la ruta en Storage. Usamos el UID para organizar.
                // Sobrescribimos la imagen anterior con el mismo nombre.
                const filePath = `profile_images/${user.uid}/profile.jpg`;
                const storageRef = ref(this.storage, filePath);

                // uploadBytes devuelve una Promise<UploadResult>, la convertimos a Observable
                return from(uploadBytes(storageRef, file)).pipe(
                    // Una vez subida, obtenemos la URL de descarga
                    switchMap((uploadResult) => {
                        return from(getDownloadURL(uploadResult.ref)); // getDownloadURL devuelve Promise<string>
                    }),
                );
            }),
        );
    }
}
