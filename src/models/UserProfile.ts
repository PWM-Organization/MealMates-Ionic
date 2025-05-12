// Definimos una interfaz para el perfil de usuario
export interface UserProfile {
    uid: string;
    email?: string; // Email de Auth, opcional aquí
    displayName?: string | null;
    description?: string | null;
    photoURL?: string | null;
}
