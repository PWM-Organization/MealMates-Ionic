import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { BlogComponent } from './pages/blog/blog.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { IndexComponent } from './pages/index/index.component';
import { LoginComponent } from './pages/login/login.component';
import { MyRecipesComponent } from './pages/my-recipes/my-recipes.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { RecipeComponent } from './pages/recipe/recipe.component';
import { RecipeGeneratorComponent } from './pages/recipe-generator/recipe-generator.component';
import { RegisterComponent } from './pages/register/register.component';
import { WeeklyPlannerComponent } from './pages/weekly-planner/weekly-planner.component';

const routes: Routes = [
  { path: '', component: IndexComponent },
  { path: 'blog', component: BlogComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'login', component: LoginComponent },
  { path: 'my-recipes', component: MyRecipesComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'recipe/:id', component: RecipeComponent }, // Usando parámetros de ruta
  { path: 'recipe-generator', component: RecipeGeneratorComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'weekly-planner', component: WeeklyPlannerComponent },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
