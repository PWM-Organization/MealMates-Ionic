import { Component, inject, signal } from '@angular/core';
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
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonSpinner,
  LoadingController,
  AlertController,
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
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonIcon,
    IonSpinner,
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

  isLoading = signal(false);
  showPassword = signal(false);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  async onSubmit() {
    if (this.loginForm.valid) {
      const loading = await this.loadingCtrl.create({
        message: 'Iniciando sesión...',
      });
      await loading.present();
      this.isLoading.set(true);

      try {
        const formValue = this.loginForm.value;
        await this.authService.login(formValue.email!, formValue.password!);

        await loading.dismiss();
        this.isLoading.set(false);
        this.router.navigate(['/favorites']);
      } catch (error: any) {
        await loading.dismiss();
        this.isLoading.set(false);

        let errorMessage = 'Error al iniciar sesión. Verifica tus credenciales.';
        if (error.code === 'auth/user-not-found') {
          errorMessage = 'No existe una cuenta con este email.';
        } else if (error.code === 'auth/wrong-password') {
          errorMessage = 'Contraseña incorrecta.';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Email inválido.';
        }

        const alert = await this.alertCtrl.create({
          header: 'Error',
          message: errorMessage,
          buttons: ['OK'],
        });
        await alert.present();
      }
    }
  }

  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  goToForgotPassword() {
    // TODO: Implement forgot password
    console.log('Forgot password clicked');
  }
}
