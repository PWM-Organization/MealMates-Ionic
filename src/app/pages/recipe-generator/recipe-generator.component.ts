import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { Recipe } from '../../../models/Recipe';

@Component({
  selector: 'app-recipe-generator',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './recipe-generator.component.html',
  styleUrls: ['./recipe-generator.component.css', '../../../styles.css'],
})

export class RecipeGeneratorComponent implements OnInit {
  recipeForm: FormGroup;
  selectedImage: File | null = null;
  imagePreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private auth: Auth,
    private storage: Storage,
    private router: Router
  ) {
    console.log('Constructor iniciado');
    this.recipeForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      prepTime: ['', [Validators.required, Validators.min(1), Validators.max(1440)]],
      difficulty: ['', Validators.required],
      category: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(500)]],
      ingredients: this.fb.array([]),
      steps: this.fb.array([])
      // recipeImage: ['', Validators.required]
    });
    console.log('Formulario creado');
  }

  onCancel() {
    this.router.navigate(['/my-recipes']);
  }

  ngOnInit() {
    console.log('ngOnInit iniciado');
    this.addIngredient();
    this.addStep();
    console.log('Ingrediente y paso inicial añadidos');
  }

  get ingredients() {
    return this.recipeForm.get('ingredients') as FormArray;
  }

  get steps() {
    return this.recipeForm.get('steps') as FormArray;
  }

  addIngredient() {
    const ingredientGroup = this.fb.group({
      ingredient: ['', Validators.required],
      quantity: ['', Validators.required]
    });
    this.ingredients.push(ingredientGroup);
  }

  removeIngredient(index: number) {
    this.ingredients.removeAt(index);
  }

  addStep() {
    const stepControl = this.fb.control('', [Validators.required, Validators.minLength(10)]);
    this.steps.push(stepControl);
  }

  removeStep(index: number) {
    this.steps.removeAt(index);
  }
  onSubmit() {
    console.log('recipe entraaa:');
    this.addRecipe();
  }

  removeImage(): void {
    this.selectedImage = null;
    this.imagePreview = null;
  }

  async addRecipe() {
    console.log('Iniciando proceso de submit del formulario');
    if (!this.selectedImage) {
      console.warn('No se ha seleccionado ninguna imagen');
      return;
    }
    console.log('Estado del formulario:', {
        isValid: this.recipeForm.valid,
        hasImage: !!this.selectedImage,
        isAuthenticated: !!this.auth.currentUser
    });
    console.log('Valores del formulario:', this.recipeForm.value);

    if (this.selectedImage && this.auth.currentUser) {
        try {
            console.log('Iniciando carga de imagen...');
            const imagePath = `recipes/${Date.now()}_${this.selectedImage.name}`;
            console.log('Ruta de imagen:', imagePath);

            const storageRef = ref(this.storage, imagePath);
            const uploadTask = await uploadBytes(storageRef, this.selectedImage);
            console.log('Imagen subida exitosamente');

            const imageUrl = await getDownloadURL(uploadTask.ref);
            console.log('URL de la imagen:', imageUrl);

            // Prepare recipe data
            const recipeData: Recipe = {
                ...this.recipeForm.value,
                imageUrl: imageUrl,
                alt: this.recipeForm.value.title,
                rate: '5', 
                chefName: this.auth.currentUser.displayName || 'Chef Desconocido',
                chefImage: this.auth.currentUser.photoURL || 'https://picsum.photos/seed/default/30/30',
                user_id: this.auth.currentUser.uid
            };
            console.log('Datos de la receta preparados:', recipeData);

            // Save to Firestore
            const recipesRef = collection(this.firestore, 'recipes');
            const docRef = await addDoc(recipesRef, recipeData);
            console.log('Receta guardada exitosamente con ID:', docRef.id);

            console.log('Redirigiendo a /my-recipes...');
            this.router.navigate(['/my-recipes']);
        } catch (error) {
            console.error('❌ Error al guardar la receta:', error);
            console.error('Detalles del error:', {
                formData: this.recipeForm.value,
                imageInfo: this.selectedImage ? {
                    name: this.selectedImage.name,
                    size: this.selectedImage.size,
                    type: this.selectedImage.type
                } : null
            });
        }
    } else {
        console.warn('Formulario inválido. Errores:', {
            formValid: this.recipeForm.valid,
            formErrors: this.recipeForm.errors,
            hasImage: !!this.selectedImage,
            isAuthenticated: !!this.auth.currentUser,
            validationErrors: {
                title: this.recipeForm.get('title')?.errors,
                description: this.recipeForm.get('description')?.errors,
                ingredients: this.recipeForm.get('ingredients')?.errors,
                steps: this.recipeForm.get('steps')?.errors,
            }
        });
    }
  }

  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
        this.selectedImage = file;
        const reader = new FileReader();
        reader.onload = () => {
            this.imagePreview = reader.result as string;
        };
        reader.readAsDataURL(file);
        console.log('Imagen seleccionada:', file.name);
    }
  }

  logButtonClick(): void {
    console.log('Botón clickeado', { formValid: this.recipeForm.valid, hasImage: !!this.selectedImage });
  }
}

