import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { BlogRecipesListComponent } from '../../components/blog-recipes-list/blog-recipes-list.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [
    BlogRecipesListComponent, 
    RouterModule, IonicModule
  ],
  templateUrl: './index.component.html',
  styleUrls: [
    './index.component.css',
  ]
})
export class IndexComponent {

}
