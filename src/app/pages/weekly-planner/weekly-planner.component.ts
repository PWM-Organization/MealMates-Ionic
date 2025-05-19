import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RecipesListComponent } from '../../components/recipes-list/recipes-list.component';

@Component({
  selector: 'app-weekly-planner',
  standalone: true,
  imports: [RecipesListComponent, IonicModule, CommonModule],
  templateUrl: './weekly-planner.component.html',
  styleUrls: ['./weekly-planner.component.scss'],
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
