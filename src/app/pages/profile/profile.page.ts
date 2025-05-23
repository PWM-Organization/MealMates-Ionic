import { Component, OnInit, signal, inject } from '@angular/core';
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
  LoadingController,
  AlertController,
  ToastController,
  ActionSheetController,
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';
import { User } from '../../../models/user.model';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

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
  ],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
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
  isUploadingImage = signal(false);
  currentUser = signal<User | null>(null);

  profileForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    bio: ['', [Validators.maxLength(200)]],
    phone: [''],
    location: [''],
  });

  async ngOnInit() {
    await this.loadUserProfile();
  }

  async loadUserProfile() {
    const user = this.authService.userProfile();
    if (user) {
      this.currentUser.set(user);
      this.profileForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        bio: user.bio || '',
        phone: user.phone || '',
        location: user.location || '',
      });
    }
  }

  toggleEdit() {
    this.isEditing.set(!this.isEditing());
    if (!this.isEditing()) {
      // Reset form when canceling edit
      this.loadUserProfile();
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

        await this.authService.updateUserProfile({
          firstName: formValue.firstName!,
          lastName: formValue.lastName!,
          bio: formValue.bio || undefined,
          phone: formValue.phone || undefined,
          location: formValue.location || undefined,
        });

        await loading.dismiss();
        await this.showToast('Perfil actualizado exitosamente', 'checkmark-circle-outline');
        this.isEditing.set(false);
        await this.loadUserProfile();
      } catch (error: any) {
        await loading.dismiss();
        console.error('Error updating profile:', error);
        await this.showAlert('Error', 'No se pudo actualizar el perfil');
      } finally {
        this.isLoading.set(false);
      }
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
      });

      if (image.dataUrl) {
        await this.uploadProfileImage(image.dataUrl);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
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

      await loading.dismiss();
      await this.showToast('Imagen actualizada exitosamente', 'checkmark-circle-outline');
      await this.loadUserProfile();
    } catch (error: any) {
      await loading.dismiss();
      console.error('Error uploading image:', error);
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
