import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
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
  selector: 'app-register',
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
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private loadingCtrl = inject(LoadingController);
  private alertCtrl = inject(AlertController);

  isLoading = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  registerForm = this.fb.group(
    {
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: this.passwordMatchValidator },
  );

  passwordMatchValidator(form: AbstractControl) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    return password?.value === confirmPassword?.value ? null : { passwordMismatch: true };
  }

  async onSubmit() {
    if (this.registerForm.valid) {
      const loading = await this.loadingCtrl.create({
        message: 'Creando cuenta...',
      });
      await loading.present();
      this.isLoading.set(true);

      try {
        const formValue = this.registerForm.value;
        await this.authService.register(formValue.email!, formValue.password!, {
          firstName: formValue.firstName!,
          lastName: formValue.lastName!,
          email: formValue.email!,
        });

        await loading.dismiss();
        this.isLoading.set(false);

        const successAlert = await this.alertCtrl.create({
          header: '¡Cuenta creada!',
          message: 'Tu cuenta ha sido creada exitosamente.',
          buttons: ['OK'],
        });
        await successAlert.present();

        this.router.navigate(['/favorites']);
      } catch (error: any) {
        await loading.dismiss();
        this.isLoading.set(false);

        let errorMessage = 'Error al crear la cuenta. Inténtalo de nuevo.';
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'Este email ya está registrado. Intenta con otro email.';
        } else if (error.code === 'auth/weak-password') {
          errorMessage = 'La contraseña es muy débil. Usa al menos 6 caracteres.';
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

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
