import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonicModule, LoadingController, AlertController, ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

// Custom Validator para confirmar contraseña
export function passwordMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (!password || !confirmPassword || password === confirmPassword) {
      return null;
    }

    return { passwordMismatch: true };
  };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private loadingCtrl = inject(LoadingController);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

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
    { validators: passwordMatchValidator() },
  );

  async onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      await this.showErrorToast('Por favor completa todos los campos correctamente');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Creando tu cuenta...',
      spinner: 'crescent',
    });
    await loading.present();

    try {
      const formValue = this.registerForm.value;
      await this.authService.register(formValue.email!, formValue.password!, {
        firstName: formValue.firstName!,
        lastName: formValue.lastName!,
        email: formValue.email!,
      });

      await loading.dismiss();
      await this.showSuccessToast('¡Cuenta creada exitosamente! Bienvenido a MealMates');
      this.router.navigate(['/']);
    } catch (error: any) {
      await loading.dismiss();
      console.error('Registration error:', error);

      let errorMessage = 'Error al crear la cuenta. Inténtalo de nuevo.';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este email ya está registrado. Usa otro email o inicia sesión.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'El email proporcionado no es válido.';
      }

      await this.showErrorAlert(errorMessage);
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
      header: 'Error de registro',
      message,
      buttons: ['Entendido'],
      cssClass: 'error-alert',
    });
    await alert.present();
  }

  // Getters para validación en template
  get firstNameError(): string | null {
    const control = this.registerForm.get('firstName');
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'El nombre es requerido';
      if (control.errors['minlength']) return 'El nombre debe tener al menos 2 caracteres';
    }
    return null;
  }

  get lastNameError(): string | null {
    const control = this.registerForm.get('lastName');
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'Los apellidos son requeridos';
      if (control.errors['minlength']) return 'Los apellidos deben tener al menos 2 caracteres';
    }
    return null;
  }

  get emailError(): string | null {
    const control = this.registerForm.get('email');
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'El email es requerido';
      if (control.errors['email']) return 'Ingresa un email válido';
    }
    return null;
  }

  get passwordError(): string | null {
    const control = this.registerForm.get('password');
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'La contraseña es requerida';
      if (control.errors['minlength']) return 'La contraseña debe tener al menos 6 caracteres';
    }
    return null;
  }

  get confirmPasswordError(): string | null {
    const control = this.registerForm.get('confirmPassword');
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'Confirma tu contraseña';
    }

    // Verificar si las contraseñas no coinciden
    if (this.registerForm.hasError('passwordMismatch') && control?.touched) {
      return 'Las contraseñas no coinciden';
    }

    return null;
  }
}
