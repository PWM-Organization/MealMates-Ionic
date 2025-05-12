import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * Guardia funcional para proteger rutas que requieren autenticación.
 * Si el usuario no está autenticado, redirige a la página de login ('/login').
 */
export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.authState$.pipe(
        take(1), // Tomamos solo el primer valor emitido para decidir
        map((user) => {
            // Si hay un usuario (está logueado), permitimos el acceso
            if (user) {
                return true;
            }
            // Si no hay usuario (no está logueado), redirigimos a login
            return router.parseUrl('/login');
            // Alternativamente: return router.createUrlTree(['/login']);
        }),
    );
};
