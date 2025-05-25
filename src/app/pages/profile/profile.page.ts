import { Component, OnInit, signal, inject, OnDestroy, EffectRef, effect } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonAvatar,
  IonText,
  IonSpinner,
  IonButtons,
  IonActionSheet,
  IonList,
  IonNote,
  IonRefresher,
  IonRefresherContent,
  LoadingController,
  AlertController,
  ToastController,
  ActionSheetController,
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';
import { User } from '../../../models/user.model';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../../firebase.config';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DatePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonIcon,
    IonAvatar,
    IonText,
    IonSpinner,
    IonButtons,
    IonActionSheet,
    IonList,
    IonNote,
    IonRefresher,
    IonRefresherContent,
  ],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private storageService = inject(StorageService);
  private router = inject(Router);
  private loadingCtrl = inject(LoadingController);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private actionSheetCtrl = inject(ActionSheetController);

  isEditing = signal(false);
  isLoading = signal(false);
  isRefreshing = signal(false);
  isUploadingImage = signal(false);
  currentUser = signal<User | null>(null);
  loadError = signal<string | null>(null);

  private authSubscription?: Subscription;
  private userProfileEffect?: EffectRef;

  profileForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    bio: ['', [Validators.maxLength(200)]],
    phone: [''],
    location: [''],
  });

  async ngOnInit() {
    console.log('🔄 Profile page initializing...');
    await this.loadUserProfile();

    // Set up an effect to react to user profile changes
    this.userProfileEffect = effect(() => {
      const user = this.authService.userProfile();
      if (user) {
        this.currentUser.set(user);
        this.updateForm(user);
      }
    });
  }

  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
    this.userProfileEffect?.destroy();
  }

  /**
   * 🔄 Load user profile from AuthService with Firebase refresh fallback
   */
  async loadUserProfile() {
    this.isLoading.set(true);
    this.loadError.set(null);

    try {
      const authUser = this.authService.currentUser();
      if (!authUser) {
        this.loadError.set('Usuario no autenticado');
        return;
      }

      // Get user document from Firestore
      const userDoc = await getDoc(doc(firestore, 'users', authUser.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        this.currentUser.set(userData);

        // Update form with user data, using empty strings as fallbacks
        this.profileForm.patchValue({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || authUser.email || '',
          bio: userData.bio || '',
          phone: userData.phone || '',
          location: userData.location || '',
        });

        // Update the user profile in AuthService
        this.authService.updateUserProfileCache(userData);
      } else {
        // If user document doesn't exist, initialize with auth data
        const initialUserData: User = {
          uid: authUser.uid,
          email: authUser.email || '',
          firstName: '',
          lastName: '',
          photoURL: authUser.photoURL || '',
          createdAt: new Date(),
          lastActiveAt: new Date(),
          isVerified: authUser.emailVerified,
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

        // Create the user document
        await this.authService.updateUserProfile(initialUserData);

        // Update local state
        this.currentUser.set(initialUserData);
        this.profileForm.patchValue({
          email: initialUserData.email,
          firstName: '',
          lastName: '',
          bio: '',
          phone: '',
          location: '',
        });
      }
    } catch (error) {
      console.error('❌ Error loading user profile:', error);
      this.loadError.set('Error al cargar el perfil');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * 🔄 Explicitly refresh user data from Firestore
   */
  async refreshFromFirestore(uid?: string): Promise<void> {
    try {
      const userId = uid || this.authService.currentUser()?.uid;
      if (!userId) {
        throw new Error('No user ID available');
      }

      console.log('🔄 Refreshing user profile from Firestore for:', userId);

      const userDoc = await getDoc(doc(firestore, 'users', userId));

      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        console.log('✅ Fresh user data from Firestore:', userData.email);

        this.currentUser.set(userData);
        this.updateForm(userData);

        // Update AuthService cache with the refreshed user data
        this.authService.updateUserProfileCache(userData);
      } else {
        console.warn('⚠️ User document not found in Firestore');
        this.loadError.set('Perfil no encontrado');
      }
    } catch (error) {
      console.error('❌ Error refreshing from Firestore:', error);
      this.loadError.set('Error al actualizar desde Firebase');
    }
  }

  /**
   * 📝 Update form with user data
   */
  private updateForm(user: User) {
    this.profileForm.patchValue({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      bio: user.bio || '',
      phone: user.phone || '',
      location: user.location || '',
    });
  }

  /**
   * 🔄 Handle pull-to-refresh
   */
  async onRefresh(event: any) {
    this.isRefreshing.set(true);

    try {
      await this.refreshFromFirestore();
      await this.showToast('Perfil actualizado', 'refresh-outline');
    } catch (error) {
      console.error('Error during refresh:', error);
      await this.showAlert('Error', 'No se pudo actualizar el perfil');
    } finally {
      this.isRefreshing.set(false);
      event.target.complete();
    }
  }

  /**
   * 🖼️ Get profile image URL with proper fallback
   */
  getProfileImageUrl(): string {
    const user = this.currentUser();
    if (!user) return 'assets/profiles/default-avatar.svg';

    // Try profileImageUrl first (Firebase Storage), then photoURL, then default
    return user.profileImageUrl || user.photoURL || 'assets/profiles/default-avatar.svg';
  }

  /**
   * 🖼️ Handle image loading errors
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'assets/profiles/default-avatar.svg';
    }
  }

  toggleEdit() {
    this.isEditing.set(!this.isEditing());
    if (!this.isEditing()) {
      // Reset form when canceling edit
      const user = this.currentUser();
      if (user) {
        this.updateForm(user);
      }
    }
  }

  async onSave() {
    if (this.profileForm.valid) {
      const loading = await this.loadingCtrl.create({
        message: 'Actualizando perfil...',
        spinner: 'crescent',
      });
      await loading.present();

      try {
        this.isLoading.set(true);
        const formValue = this.profileForm.value;
        const currentUser = this.currentUser();

        if (!currentUser) {
          throw new Error('No user data available');
        }

        // Prepare update data - use empty strings instead of undefined
        const updateData: Partial<User> = {
          firstName: formValue.firstName!,
          lastName: formValue.lastName!,
          bio: formValue.bio || '',
          phone: formValue.phone || '',
          location: formValue.location || '',
          updatedAt: new Date(),
        };

        // Update user profile
        await this.authService.updateUserProfile(updateData);

        // Refresh profile data from Firestore
        await this.refreshFromFirestore();

        await loading.dismiss();
        await this.showToast('Perfil actualizado exitosamente', 'checkmark-circle-outline');
        this.isEditing.set(false);
      } catch (error: any) {
        await loading.dismiss();
        console.error('❌ Error updating profile:', error);
        await this.showAlert('Error', error.message || 'No se pudo actualizar el perfil');
      } finally {
        this.isLoading.set(false);
      }
    } else {
      await this.showAlert('Error', 'Por favor completa todos los campos requeridos');
    }
  }

  async selectProfileImage() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Seleccionar imagen',
      buttons: [
        {
          text: 'Cámara',
          icon: 'camera-outline',
          handler: () => {
            this.takePicture(CameraSource.Camera);
          },
        },
        {
          text: 'Galería',
          icon: 'images-outline',
          handler: () => {
            this.takePicture(CameraSource.Photos);
          },
        },
        {
          text: 'Cancelar',
          icon: 'close-outline',
          role: 'cancel',
        },
      ],
    });
    await actionSheet.present();
  }

  async takePicture(source: CameraSource) {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: source,
        width: 800,
        height: 800,
      });

      if (image.dataUrl) {
        await this.uploadProfileImage(image.dataUrl);
      }
    } catch (error: any) {
      console.error('❌ Error taking picture:', error);

      // Handle user cancellation gracefully
      if (error.message?.includes('User cancelled')) {
        return;
      }

      await this.showAlert('Error', 'No se pudo capturar la imagen');
    }
  }

  async uploadProfileImage(dataUrl: string) {
    const loading = await this.loadingCtrl.create({
      message: 'Subiendo imagen...',
      spinner: 'crescent',
    });
    await loading.present();

    try {
      this.isUploadingImage.set(true);

      // Convert data URL to file
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = this.storageService.createFileFromBlob(blob, 'profile-image.jpg');

      // Validate and compress image
      this.storageService.validateImageFile(file, 2); // 2MB limit
      const compressedFile = await this.storageService.compressImage(file);

      // Upload to Firebase Storage
      const currentUser = this.authService.currentUser();
      if (!currentUser) throw new Error('User not authenticated');

      const imageUrl = await this.storageService.uploadProfileImage(compressedFile, currentUser.uid);

      // Update user profile with new image URL
      await this.authService.updateUserProfile({ profileImageUrl: imageUrl });

      // 🔄 Refresh profile data to show new image
      await this.refreshFromFirestore();

      await loading.dismiss();
      await this.showToast('Imagen actualizada exitosamente', 'checkmark-circle-outline');
    } catch (error: any) {
      await loading.dismiss();
      console.error('❌ Error uploading image:', error);
      await this.showAlert('Error', error.message || 'No se pudo subir la imagen');
    } finally {
      this.isUploadingImage.set(false);
    }
  }

  async logout() {
    const alert = await this.alertCtrl.create({
      header: 'Cerrar Sesión',
      message: '¿Estás seguro que deseas cerrar sesión?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          handler: async () => {
            await this.authService.logout();
            this.router.navigate(['/landing']);
          },
        },
      ],
    });
    await alert.present();
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  private async showToast(message: string, icon: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'top',
      icon,
      color: 'success',
    });
    await toast.present();
  }

  getFormattedDate(dateValue: any): string {
    if (!dateValue) return '';

    // Handle Firebase Timestamp objects
    if (dateValue && typeof dateValue.toDate === 'function') {
      const date = dateValue.toDate();
      return new DatePipe('en-US').transform(date, 'MMM yyyy') || '';
    }

    // Handle regular Date objects
    return new DatePipe('en-US').transform(dateValue, 'MMM yyyy') || '';
  }

  getFieldError(fieldName: string): string {
    const field = this.profileForm.get(fieldName);
    if (field?.errors && field?.touched) {
      if (field.errors['required']) {
        return `${fieldName === 'firstName' ? 'Nombre' : 'Apellidos'} es requerido`;
      }
      if (field.errors['email']) {
        return 'Email inválido';
      }
      if (field.errors['minlength']) {
        return 'Mínimo 2 caracteres';
      }
      if (field.errors['maxlength']) {
        return 'Máximo 200 caracteres';
      }
    }
    return '';
  }
}
