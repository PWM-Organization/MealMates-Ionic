import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RecipesListComponent } from '../../components/recipes-list/recipes-list.component';

@Component({
    selector: 'app-my-recipes',
    standalone: true,
    imports: [RouterModule, IonicModule, FormsModule, CommonModule, RecipesListComponent],
    templateUrl: './my-recipes.component.html',
    styleUrls: ['./my-recipes.component.scss'],
})
export class MyRecipesComponent {
    activeTab: 'created' | 'saved' = 'created';

    changeTab(tab: 'created' | 'saved') {
        this.activeTab = tab;
    }

    get isCreated(): boolean {
        return this.activeTab === 'created';
    }
}
