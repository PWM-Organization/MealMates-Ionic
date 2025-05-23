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
        message: 'Creando cuenta...',
        spinner: 'crescent',
      });
      await loading.present();

      try {
        this.isLoading.set(true);
        const formValue = this.registerForm.value;

        const userData: UserRegistrationData = {
          firstName: formValue.firstName!,
          lastName: formValue.lastName!,
          email: formValue.email!,
        };

        await this.authService.register(formValue.email!, formValue.password!, userData);

        await loading.dismiss();
        await this.showToast('¡Cuenta creada exitosamente!', 'checkmark-circle-outline');
        this.router.navigate(['/tabs/explore']);
      } catch (error: any) {
        await loading.dismiss();
        console.error('Registration error:', error);

        let message = 'Error al crear la cuenta';
        if (error.code === 'auth/email-already-in-use') {
          message = 'Ya existe una cuenta con este email';
        } else if (error.code === 'auth/invalid-email') {
          message = 'Email inválido';
        } else if (error.code === 'auth/weak-password') {
          message = 'La contraseña es muy débil';
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

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  goToLogin() {
    this.router.navigate(['/login']);
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
