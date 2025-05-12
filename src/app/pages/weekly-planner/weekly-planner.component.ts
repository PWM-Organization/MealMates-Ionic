import { Component } from '@angular/core';
import { RecipesListComponent } from '../../components/recipes-list/recipes-list.component';

@Component({
  selector: 'app-weekly-planner',
  standalone: true,
  imports: [RecipesListComponent],
  templateUrl: './weekly-planner.component.html',
  styleUrls: ['./weekly-planner.component.css'],
})
export class WeeklyPlannerComponent {
  recipesList: any[] = []
  weeklyPlan = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo"
  ];
}
