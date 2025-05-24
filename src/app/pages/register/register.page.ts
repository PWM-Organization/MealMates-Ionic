import { Component, signal, inject } from '@angular/core';
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
  IonCheckbox,
  LoadingController,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { UserRegistrationData } from '../../../models/user.model';

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
    IonCheckbox,
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
  private toastCtrl = inject(ToastController);

  isLoading = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  firstNameFocused = signal(false);
  lastNameFocused = signal(false);
  emailFocused = signal(false);
  passwordFocused = signal(false);
  confirmPasswordFocused = signal(false);

  registerForm = this.fb.group(
    {
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]],
    },
    { validators: this.passwordMatchValidator },
  );

  passwordMatchValidator(control: AbstractControl) {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    return password?.value === confirmPassword?.value ? null : { passwordMismatch: true };
  }

  async onSubmit() {
    if (this.registerForm.valid) {
      const loading = await this.loadingCtrl.create({
        message: 'Registrando usuario...',
      });
      await loading.present();

      try {
        const formValue = this.registerForm.value;
        const userData: UserRegistrationData = {
          firstName: formValue.firstName!,
          lastName: formValue.lastName!,
          email: formValue.email!,
          password: formValue.password!,
        };

        await this.authService.register(userData);
        await loading.dismiss();

        // Show success message
        const toast = await this.toastCtrl.create({
          message: '¡Registro exitoso! Bienvenido a MealMates.',
          duration: 3000,
          position: 'top',
          color: 'success',
        });
        await toast.present();

        // Navigate to home
        this.router.navigate(['/tabs/home']);
      } catch (error: any) {
        await loading.dismiss();
        const alert = await this.alertCtrl.create({
          header: 'Error',
          message: error.message || 'Ha ocurrido un error durante el registro.',
          buttons: ['OK'],
        });
        await alert.present();
      }
    } else {
      const alert = await this.alertCtrl.create({
        header: 'Formulario Inválido',
        message: 'Por favor completa todos los campos correctamente.',
        buttons: ['OK'],
      });
      await alert.present();
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

  goToLanding() {
    this.router.navigate(['/landing']);
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (field?.errors && field?.touched) {
      if (field.errors['required']) {
        switch (fieldName) {
          case 'firstName':
            return 'Nombre es requerido';
          case 'lastName':
            return 'Apellidos son requeridos';
          case 'email':
            return 'Email es requerido';
          case 'password':
            return 'Contraseña es requerida';
          case 'confirmPassword':
            return 'Confirmar contraseña es requerido';
          case 'acceptTerms':
            return 'Debes aceptar los términos y condiciones';
          default:
            return 'Campo requerido';
        }
      }
      if (field.errors['requiredTrue']) {
        return 'Debes aceptar los términos y condiciones';
      }
      if (field.errors['email']) {
        return 'Email inválido';
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `Mínimo ${requiredLength} caracteres`;
      }
    }

    // Check for password mismatch
    if (fieldName === 'confirmPassword' && this.registerForm.errors?.['passwordMismatch'] && field?.touched) {
      return 'Las contraseñas no coinciden';
    }

    return '';
  }
}
