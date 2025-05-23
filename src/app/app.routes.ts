import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/landing',
    pathMatch: 'full',
  },
  {
    path: 'landing',
    loadComponent: () => import('./pages/landing/landing.page').then((m) => m.LandingPage),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then((m) => m.RegisterPage),
  },
  // Main app with tabs (requires authentication)
  {
    path: 'tabs',
    loadComponent: () => import('./tabs/tabs.page').then((m) => m.TabsPage),
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'explore',
        pathMatch: 'full',
      },
      {
        path: 'explore',
        loadComponent: () => import('./pages/explore/explore.page').then((m) => m.ExplorePage),
      },
      {
        path: 'favorites',
        loadComponent: () => import('./pages/favorites/favorites.page').then((m) => m.FavoritesPage),
      },
      {
        path: 'create-recipe',
        loadComponent: () => import('./pages/create-recipe/create-recipe.page').then((m) => m.CreateRecipePage),
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.page').then((m) => m.ProfilePage),
      },
    ],
  },
  // Recipe detail (can be accessed from outside tabs)
  {
    path: 'recipe/:id',
    loadComponent: () => import('./pages/recipe-detail/recipe-detail.page').then((m) => m.RecipeDetailPage),
    canActivate: [AuthGuard],
  },
  // Legacy routes (redirect to tabs)
  {
    path: 'favorites',
    redirectTo: '/tabs/favorites',
  },
  {
    path: 'explore',
    redirectTo: '/tabs/explore',
  },
  {
    path: 'profile',
    redirectTo: '/tabs/profile',
  },
];
