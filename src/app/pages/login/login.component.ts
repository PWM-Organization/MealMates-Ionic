import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonicModule, LoadingController, AlertController, ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private loadingCtrl = inject(LoadingController);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  isLoading = signal(false);
  showPassword = signal(false);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      await this.showErrorToast('Por favor completa todos los campos correctamente');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Iniciando sesión...',
      spinner: 'crescent',
    });
    await loading.present();

    try {
      const formValue = this.loginForm.value;
      await this.authService.login(formValue.email!, formValue.password!);

      await loading.dismiss();
      await this.showSuccessToast('¡Bienvenido a MealMates!');
      this.router.navigate(['/']);
    } catch (error: any) {
      await loading.dismiss();
      console.error('Login error:', error);

      let errorMessage = 'Error al iniciar sesión. Inténtalo de nuevo.';

      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Email o contraseña incorrectos';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No existe una cuenta con este email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Contraseña incorrecta';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos fallidos. Inténtalo más tarde';
      }

      await this.showErrorAlert(errorMessage);
    }
  }

  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }

  private async showErrorToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'top',
      color: 'danger',
      icon: 'alert-circle-outline',
    });
    await toast.present();
  }

  private async showSuccessToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'top',
      color: 'success',
      icon: 'checkmark-circle-outline',
    });
    await toast.present();
  }

  private async showErrorAlert(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Error de autenticación',
      message,
      buttons: ['Entendido'],
      cssClass: 'error-alert',
    });
    await alert.present();
  }

  // Getters para validación en template
  get emailError(): string | null {
    const control = this.loginForm.get('email');
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'El email es requerido';
      if (control.errors['email']) return 'Ingresa un email válido';
    }
    return null;
  }

  get passwordError(): string | null {
    const control = this.loginForm.get('password');
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'La contraseña es requerida';
      if (control.errors['minlength']) return 'La contraseña debe tener al menos 6 caracteres';
    }
    return null;
  }
}
