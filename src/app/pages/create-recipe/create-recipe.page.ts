import { Component, signal, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonButton,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonReorder,
  IonReorderGroup,
  IonSpinner,
  IonButtons,
  IonNote,
  IonToggle,
  LoadingController,
  AlertController,
  ToastController,
  ActionSheetController,
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { RecipeService } from '../../services/recipe.service';
import { StorageService } from '../../services/storage.service';
import { DebugService } from '../../services/debug.service';
import { MemoryManagerService } from '../../services/memory-manager.service';
import { Recipe, RecipeCategory, Ingredient } from '../../../models/recipe.model';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-create-recipe',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonButton,
    IonIcon,
    IonSelect,
    IonSelectOption,
    IonReorder,
    IonReorderGroup,
    IonSpinner,
    IonButtons,
    IonNote,
    IonToggle,
  ],
  templateUrl: './create-recipe.page.html',
  styleUrls: ['./create-recipe.page.scss'],
})
export class CreateRecipePage {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private recipeService = inject(RecipeService);
  private storageService = inject(StorageService);
  private debugService = inject(DebugService);
  private memoryManager = inject(MemoryManagerService);
  private router = inject(Router);
  private loadingCtrl = inject(LoadingController);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private actionSheetCtrl = inject(ActionSheetController);

  // 🛡️ Android Crash Prevention
  private platform = Capacitor.getPlatform();

  isLoading = signal(false);
  isUploadingImage = signal(false);
  selectedImage = signal<string | null>(null);

  recipeForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    category: ['', [Validators.required]],
    difficulty: ['easy', [Validators.required]],
    cookingTime: [30, [Validators.required, Validators.min(1)]],
    servings: [4, [Validators.required, Validators.min(1)]],
    ingredients: this.fb.array([this.createIngredientControl()]),
    instructions: this.fb.array([this.createInstructionControl()]),
    tags: [''],
    isPublic: [true],
  });

  readonly categories: RecipeCategory[] = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'beverage'];

  readonly difficulties = [
    { value: 'easy', label: 'Fácil', color: 'success' },
    { value: 'medium', label: 'Intermedio', color: 'warning' },
    { value: 'hard', label: 'Difícil', color: 'danger' },
  ];

  get ingredients() {
    return this.recipeForm.get('ingredients') as FormArray;
  }

  get instructions() {
    return this.recipeForm.get('instructions') as FormArray;
  }

  createIngredientControl() {
    return this.fb.group({
      name: ['', [Validators.required]],
      amount: ['', [Validators.required]],
      unit: ['', [Validators.required]],
    });
  }

  createInstructionControl() {
    return this.fb.control('', [Validators.required, Validators.minLength(10)]);
  }

  addIngredient() {
    // 🛡️ Dynamic limits based on memory pressure
    const config = this.memoryManager.getOptimizedConfig();
    if (this.ingredients.length >= config.formLimits.maxIngredients) {
      this.showAlert(
        'Límite alcanzado',
        `Máximo ${config.formLimits.maxIngredients} ingredientes permitidos (optimización de memoria)`,
      );
      return;
    }
    this.ingredients.push(this.createIngredientControl());
  }

  removeIngredient(index: number) {
    if (this.ingredients.length > 1) {
      this.ingredients.removeAt(index);
    }
  }

  addInstruction() {
    // 🛡️ Dynamic limits based on memory pressure
    const config = this.memoryManager.getOptimizedConfig();
    if (this.instructions.length >= config.formLimits.maxInstructions) {
      this.showAlert(
        'Límite alcanzado',
        `Máximo ${config.formLimits.maxInstructions} pasos permitidos (optimización de memoria)`,
      );
      return;
    }
    this.instructions.push(this.createInstructionControl());
  }

  removeInstruction(index: number) {
    if (this.instructions.length > 1) {
      this.instructions.removeAt(index);
    }
  }

  reorderInstructions(event: any) {
    const itemMove = this.instructions.at(event.detail.from);
    this.instructions.removeAt(event.detail.from);
    this.instructions.insert(event.detail.to, itemMove);
    event.detail.complete();
  }

  async selectRecipeImage() {
    // 🛡️ Check memory pressure before heavy operations
    if (this.memoryManager.shouldPreventHeavyOperations()) {
      await this.showAlert(
        'Sistema optimizando memoria',
        'Por favor, espera un momento antes de agregar imágenes para mantener la estabilidad de la app.',
      );
      return;
    }

    // 🛡️ For Android emulator, show simplified options
    if (this.debugService.shouldUseFallback()) {
      await this.showAlert(
        'Funcionalidad Limitada',
        'En el emulador, la cámara no está disponible. Puedes agregar una imagen más tarde desde un dispositivo real.',
      );
      return;
    }

    try {
      // 🛡️ Android-specific memory monitoring
      this.debugService.logMemoryUsage('Before Camera Action Sheet');

      const actionSheet = await this.actionSheetCtrl.create({
        header: 'Seleccionar imagen de receta',
        buttons: [
          {
            text: 'Cámara',
            icon: 'camera-outline',
            handler: () => {
              this.takePicture(CameraSource.Camera);
            },
          },
          {
            text: 'Galería',
            icon: 'images-outline',
            handler: () => {
              this.takePicture(CameraSource.Photos);
            },
          },
          {
            text: 'Cancelar',
            icon: 'close-outline',
            role: 'cancel',
          },
        ],
      });
      await actionSheet.present();
    } catch (error) {
      console.error('Error showing action sheet:', error);
      await this.showAlert('Error', 'No se pudo abrir el selector de imagen');
    }
  }

  async takePicture(source: CameraSource) {
    try {
      // 🛡️ Memory-aware configuration
      const config = this.memoryManager.getOptimizedConfig();

      // 🛡️ Android crash prevention
      this.debugService.logMemoryUsage('Before Camera Operation');

      // Check if Camera is available
      if (!Camera.getPhoto) {
        await this.showAlert('Error', 'La cámara no está disponible en este dispositivo');
        return;
      }

      const image = await Promise.race([
        Camera.getPhoto({
          quality: Math.floor(config.imageQuality * 100), // Memory-optimized quality
          allowEditing: true,
          resultType: CameraResultType.DataUrl,
          source: source,
          width: 1200,
          height: 1200,
        }),
        // 🛡️ Timeout for camera operations
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Camera operation timeout')), 10000)),
      ]);

      if (image.dataUrl) {
        // 🛡️ Memory-aware image size validation
        const imageSize = this.estimateImageSize(image.dataUrl);
        if (imageSize > config.maxImageSize) {
          await this.showAlert(
            'Imagen muy grande',
            `La imagen es de ${(imageSize / 1024 / 1024).toFixed(1)}MB. Máximo permitido: ${(
              config.maxImageSize /
              1024 /
              1024
            ).toFixed(1)}MB`,
          );
          return;
        }

        this.selectedImage.set(image.dataUrl);
        this.debugService.logMemoryUsage('After Image Selection');
      }
    } catch (error: any) {
      console.error('Error taking picture:', error);

      // 🛡️ User-friendly error messages
      let errorMessage = 'No se pudo capturar la imagen';
      if (error.message?.includes('timeout')) {
        errorMessage = 'La operación de cámara tardó demasiado. Inténtalo de nuevo.';
      } else if (error.message?.includes('User cancelled')) {
        return; // Don't show error for user cancellation
      } else if (error.message?.includes('permission')) {
        errorMessage = 'Se requieren permisos de cámara. Verifica la configuración de la app.';
      }

      await this.showAlert('Error', errorMessage);
    }
  }

  /**
   * 🛡️ Estimate image size from dataURL
   */
  private estimateImageSize(dataUrl: string): number {
    // Base64 size estimation (approximately 4/3 of original)
    const base64String = dataUrl.split(',')[1];
    return (base64String.length * 3) / 4;
  }

  async onSubmit() {
    if (this.recipeForm.valid) {
      // 🛡️ Memory monitoring before heavy operations
      this.debugService.logMemoryUsage('Before Recipe Submission');

      const loading = await this.loadingCtrl.create({
        message: 'Creando receta...',
        spinner: 'crescent',
      });
      await loading.present();

      try {
        this.isLoading.set(true);
        const currentUser = this.authService.currentUser();
        if (!currentUser) throw new Error('Usuario no autenticado');

        const formValue = this.recipeForm.value;

        // Prepare recipe data
        const recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> = {
          title: formValue.title!,
          description: formValue.description!,
          category: formValue.category as RecipeCategory,
          difficulty: formValue.difficulty as 'easy' | 'medium' | 'hard',
          cookingTime: formValue.cookingTime!,
          servings: formValue.servings!,
          ingredients: this.formatIngredients(),
          instructions: this.formatInstructions(),
          tags: this.formatTags(formValue.tags || ''),
          authorId: currentUser.uid,
          imageUrl: '', // Will be updated after image upload
          isPublic: formValue.isPublic!,
          likes: 0,
          saves: 0,
        };

        // Create recipe first to get ID
        const recipeId = await this.recipeService.createRecipe(recipeData);

        // Upload image if selected (with Android-specific handling)
        if (this.selectedImage()) {
          try {
            const imageUrl = await this.uploadRecipeImageSafely(recipeId);
            await this.recipeService.updateRecipe(recipeId, { imageUrl });
          } catch (imageError) {
            console.warn('Image upload failed, proceeding without image:', imageError);
            // Don't fail the entire recipe creation if image upload fails
          }
        }

        await loading.dismiss();
        await this.showToast('¡Receta creada exitosamente!', 'checkmark-circle-outline');

        // 🛡️ Clean up before navigation
        this.cleanupResources();
        this.router.navigate(['/tabs/explore']);
      } catch (error: any) {
        await loading.dismiss();
        console.error('Error creating recipe:', error);
        await this.showAlert('Error', error.message || 'No se pudo crear la receta');
      } finally {
        this.isLoading.set(false);
      }
    } else {
      await this.showAlert('Error', 'Por favor completa todos los campos requeridos');
    }
  }

  /**
   * 🛡️ Safe image upload with Android optimizations
   */
  private async uploadRecipeImageSafely(recipeId: string): Promise<string> {
    const selectedImageData = this.selectedImage();
    if (!selectedImageData) throw new Error('No image selected');

    this.isUploadingImage.set(true);

    try {
      // 🛡️ Memory-aware configuration
      const config = this.memoryManager.getOptimizedConfig();

      // Convert data URL to file
      const response = await fetch(selectedImageData);
      const blob = await response.blob();
      const file = this.storageService.createFileFromBlob(blob, 'recipe-image.jpg');

      // Validate and compress image using memory-aware limits
      this.storageService.validateImageFile(file, config.maxImageSize / 1024 / 1024); // Convert to MB
      const compressedFile = await this.storageService.compressImage(file, 1200, config.imageQuality);

      // Upload to Firebase Storage
      const currentUser = this.authService.currentUser();
      if (!currentUser) throw new Error('User not authenticated');

      return await this.storageService.uploadRecipeImage(compressedFile, currentUser.uid, recipeId);
    } finally {
      this.isUploadingImage.set(false);
    }
  }

  /**
   * 🛡️ Clean up resources to prevent memory leaks
   */
  private cleanupResources(): void {
    // Clear selected image from memory
    if (this.selectedImage()) {
      const imageUrl = this.selectedImage();
      if (imageUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
      this.selectedImage.set(null);
    }

    // Reset form arrays to minimum
    while (this.ingredients.length > 1) {
      this.ingredients.removeAt(this.ingredients.length - 1);
    }
    while (this.instructions.length > 1) {
      this.instructions.removeAt(this.instructions.length - 1);
    }
  }

  private formatIngredients(): Ingredient[] {
    const ingredients = this.ingredients.value;
    return ingredients.map((ing: any) => ({
      name: ing.name,
      amount: parseFloat(ing.amount),
      unit: ing.unit,
    }));
  }

  private formatInstructions(): string[] {
    return this.instructions.value.filter((instruction: string) => instruction.trim() !== '');
  }

  private formatTags(tagsString: string): string[] {
    if (!tagsString) return [];
    return tagsString
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag !== '');
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      breakfast: 'Desayuno',
      lunch: 'Almuerzo',
      dinner: 'Cena',
      snack: 'Snack',
      dessert: 'Postre',
      beverage: 'Bebida',
    };
    return labels[category] || category;
  }

  getFieldError(fieldName: string): string {
    const field = this.recipeForm.get(fieldName);
    if (field?.errors && field?.touched) {
      if (field.errors['required']) {
        return 'Este campo es requerido';
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `Mínimo ${requiredLength} caracteres`;
      }
      if (field.errors['min']) {
        return 'Debe ser mayor a 0';
      }
    }
    return '';
  }

  getIngredientError(index: number, fieldName: string): string {
    const ingredient = this.ingredients.at(index);
    const field = ingredient.get(fieldName);
    if (field?.errors && field?.touched) {
      if (field.errors['required']) {
        return 'Requerido';
      }
    }
    return '';
  }

  getInstructionError(index: number): string {
    const instruction = this.instructions.at(index);
    if (instruction?.errors && instruction?.touched) {
      if (instruction.errors['required']) {
        return 'La instrucción es requerida';
      }
      if (instruction.errors['minlength']) {
        return 'Mínimo 10 caracteres';
      }
    }
    return '';
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  private async showToast(message: string, icon: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'top',
      icon,
      color: 'success',
    });
    await toast.present();
  }

  goBack() {
    // 🛡️ Clean up before navigation
    this.cleanupResources();
    this.router.navigate(['/tabs/explore']);
  }
}
