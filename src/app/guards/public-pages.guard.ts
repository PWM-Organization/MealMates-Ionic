import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * Guardia funcional para prevenir el acceso a páginas públicas (como login, register)
 * si el usuario ya está autenticado.
 * Redirige a la ruta raíz ('/') si el usuario está autenticado.
 */
export const publicPagesGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.authState$.pipe(
        take(1), // Tomamos solo el primer valor emitido para decidir
        map((user) => {
            // Si hay un usuario (está logueado)
            if (user) {
                // Redirigimos a la página principal
                return router.parseUrl('/');
                // Alternativamente: return router.createUrlTree(['/']);
            }
            // Si no hay usuario (no está logueado), permitimos el acceso
            return true;
        }),
    );
};
