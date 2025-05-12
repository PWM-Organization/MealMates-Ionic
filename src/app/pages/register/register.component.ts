import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
    AbstractControl,
    FormBuilder,
    ReactiveFormsModule,
    ValidationErrors,
    ValidatorFn,
    Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

// Custom Validator Function
export function passwordMatchValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const password = control.get('password')?.value;
        const confirmPassword = control.get('confirmPassword')?.value;

        // Return null if controls haven't initialized yet or passwords match
        if (!password || !confirmPassword || password === confirmPassword) {
            return null;
        }

        // Return error if passwords don't match
        return { passwordMismatch: true };
    };
}

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [RouterModule, ReactiveFormsModule, CommonModule],
    templateUrl: './register.component.html',
    styleUrls: [
        './register.component.css', 
        '../login/login.component.css'
    ]
})
export class RegisterComponent {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);

    registerError: string | null = null;

    registerForm = this.fb.group(
        {
            email: ['', [Validators.required, Validators.email]],
            // Añadimos validación de longitud mínima para la contraseña
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required],
        },
        { validators: passwordMatchValidator() },
    ); // Aplicamos el validador personalizado al grupo

    async onSubmit() {
        this.registerError = null;
        if (this.registerForm.invalid) {
            // Marcar campos como tocados para mostrar errores si es necesario
            this.registerForm.markAllAsTouched();
            return;
        }

        const email = this.registerForm.value.email ?? '';
        const password = this.registerForm.value.password ?? '';

        try {
            await this.authService.register({ email, password });
            // No es necesario iniciar sesión explícitamente, Firebase lo hace tras el registro.
            // Redirigimos al usuario a la página principal (o donde quieras)
            this.router.navigate(['/']);
        } catch (error: any) {
            console.error('Registration failed:', error);
            if (error.code === 'auth/email-already-in-use') {
                this.registerError = 'Este correo electrónico ya está registrado.';
            } else if (error.code === 'auth/weak-password') {
                this.registerError = 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
            } else {
                this.registerError = 'Ocurrió un error inesperado durante el registro. Inténtalo de nuevo.';
            }
        }
    }
}
