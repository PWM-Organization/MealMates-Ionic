import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { BlogRecipesListComponent } from '../../components/blog-recipes-list/blog-recipes-list.component';
import { CategoriesComponent } from '../../components/categories/categories.component';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [BlogRecipesListComponent, CategoriesComponent, IonicModule],
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.scss']
})
export class BlogComponent {

}
