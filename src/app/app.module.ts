import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { environment } from './firebase.config';

import { BlogRecipesListComponent } from './components/blog-recipes-list/blog-recipes-list.component';
import { CategoriesComponent } from './components/categories/categories.component';
import { DaysGridComponent } from './components/days-grid/days-grid.component';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { RecipeCardCreatedComponent } from './components/recipe-card-created/recipe-card-created.component';
import { RecipeCardDefaultComponent } from './components/recipe-card-default/recipe-card-default.component';
import { RecipeCardSavedComponent } from './components/recipe-card-saved/recipe-card-saved.component';
import { RecipesListComponent } from './components/recipes-list/recipes-list.component';

@NgModule({
  declarations: [AppComponent,],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, BlogRecipesListComponent, CategoriesComponent, DaysGridComponent, FooterComponent, HeaderComponent, RecipeCardCreatedComponent, RecipeCardDefaultComponent, RecipeCardSavedComponent, RecipesListComponent],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }, provideFirebaseApp(() => initializeApp(environment.firebaseConfig)), provideFirestore(() => getFirestore())],
  bootstrap: [AppComponent],
})
export class AppModule {}
