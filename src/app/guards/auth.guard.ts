import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    }

    // Redirect to login if not authenticated
    this.router.navigate(['/login']);
    return false;
  }
}
