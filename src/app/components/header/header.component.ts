import { Component, Input, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { User } from '@angular/fire/auth';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [RouterModule, CommonModule],
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
    @Input() user: User | null = null;

    private authService = inject(AuthService);
    private router = inject(Router);

    async logout() {
        try {
            await this.authService.logout();
            this.router.navigate(['/login']);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }
}
