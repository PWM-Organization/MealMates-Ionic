import { Component } from '@angular/core';
import { BlogRecipesListComponent } from '../../components/blog-recipes-list/blog-recipes-list.component';
import { CategoriesComponent } from '../../components/categories/categories.component';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [BlogRecipesListComponent, CategoriesComponent],
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.css']
})
export class BlogComponent {

}
