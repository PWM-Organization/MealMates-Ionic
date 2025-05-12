import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [RouterModule, ReactiveFormsModule, CommonModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css'],
})
export class LoginComponent {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);

    loginForm = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', Validators.required],
    });

    loginError: string | null = null;

    async onSubmit() {
        this.loginError = null;
        if (this.loginForm.invalid) {
            return;
        }

        const email = this.loginForm.value.email ?? '';
        const password = this.loginForm.value.password ?? '';

        try {
            await this.authService.login({ email, password });
            this.router.navigate(['/']);
        } catch (error: any) {
            console.error('Login failed:', error);
            if (
                error.code === 'auth/invalid-credential' ||
                error.code === 'auth/invalid-email' ||
                error.code === 'auth/wrong-password'
            ) {
                this.loginError = 'Invalid email or password. Please try again.';
            } else {
                this.loginError = 'An unexpected error occurred during login. Please try again later.';
            }
        }
    }
}
