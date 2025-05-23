import { Component, signal, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
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
  IonText,
  IonSpinner,
  IonFab,
  IonFabButton,
  LoadingController,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
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
    IonText,
    IonSpinner,
    IonFab,
    IonFabButton,
  ],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private loadingCtrl = inject(LoadingController);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  isLoading = signal(false);
  showPassword = signal(false);
  emailFocused = signal(false);
  passwordFocused = signal(false);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  async onSubmit() {
    if (this.loginForm.valid) {
      const loading = await this.loadingCtrl.create({
        message: 'Iniciando sesión...',
        spinner: 'crescent',
      });
      await loading.present();

      try {
        this.isLoading.set(true);
        const formValue = this.loginForm.value;
        await this.authService.login(formValue.email!, formValue.password!);

        await loading.dismiss();
        await this.showToast('¡Bienvenido de vuelta!', 'checkmark-circle');
        this.router.navigate(['/favorites']);
      } catch (error: any) {
        await loading.dismiss();
        console.error('Login error:', error);

        let message = 'Error al iniciar sesión';
        if (error.code === 'auth/user-not-found') {
          message = 'Usuario no encontrado';
        } else if (error.code === 'auth/wrong-password') {
          message = 'Contraseña incorrecta';
        } else if (error.code === 'auth/invalid-email') {
          message = 'Email inválido';
        } else if (error.code === 'auth/too-many-requests') {
          message = 'Demasiados intentos fallidos. Intenta más tarde';
        }

        await this.showAlert('Error', message);
      } finally {
        this.isLoading.set(false);
      }
    } else {
      await this.showAlert('Error', 'Por favor completa todos los campos correctamente');
    }
  }

  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  goToLanding() {
    this.router.navigate(['/landing']);
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

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors && field?.touched) {
      if (field.errors['required']) {
        return `${fieldName === 'email' ? 'Email' : 'Contraseña'} es requerido`;
      }
      if (field.errors['email']) {
        return 'Email inválido';
      }
      if (field.errors['minlength']) {
        return 'La contraseña debe tener al menos 6 caracteres';
      }
    }
    return '';
  }
}
