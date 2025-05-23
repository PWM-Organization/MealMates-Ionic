import { Injectable, inject } from '@angular/core';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../../firebase.config';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private storage = storage;

  /**
   * Uploads a file to Firebase Storage
   * @param file - The file to upload
   * @param path - The storage path (e.g., 'users/profile-images/userId')
   * @returns Promise with the download URL
   */
  async uploadFile(file: File, path: string): Promise<string> {
    try {
      // Create a storage reference
      const storageRef = ref(this.storage, path);

      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);

      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  }

  /**
   * Uploads a profile image for a user
   * @param file - The image file
   * @param userId - The user's ID
   * @returns Promise with the download URL
   */
  async uploadProfileImage(file: File, userId: string): Promise<string> {
    const fileName = `profile-${Date.now()}.${file.name.split('.').pop()}`;
    const path = `users/profile-images/${userId}/${fileName}`;
    return this.uploadFile(file, path);
  }

  /**
   * Uploads a recipe image
   * @param file - The image file
   * @param userId - The user's ID
   * @param recipeId - The recipe's ID
   * @returns Promise with the download URL
   */
  async uploadRecipeImage(file: File, userId: string, recipeId?: string): Promise<string> {
    const fileName = `recipe-${Date.now()}.${file.name.split('.').pop()}`;
    const recipeFolder = recipeId || 'temp';
    const path = `recipes/${userId}/${recipeFolder}/${fileName}`;
    return this.uploadFile(file, path);
  }

  /**
   * Deletes a file from Firebase Storage
   * @param url - The download URL of the file to delete
   */
  async deleteFile(url: string): Promise<void> {
    try {
      const storageRef = ref(this.storage, url);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  /**
   * Creates a file from a blob (useful for camera/photo selection)
   * @param blob - The blob data
   * @param filename - The desired filename
   * @returns File object
   */
  createFileFromBlob(blob: Blob, filename: string): File {
    return new File([blob], filename, { type: blob.type });
  }

  /**
   * Validates if the file is an image and within size limits
   * @param file - The file to validate
   * @param maxSizeMB - Maximum size in MB (default: 5MB)
   * @returns true if valid, throws error if not
   */
  validateImageFile(file: File, maxSizeMB: number = 5): boolean {
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      throw new Error('El archivo debe ser una imagen');
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new Error(`La imagen debe ser menor a ${maxSizeMB}MB`);
    }

    // Check if it's a supported format
    const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!supportedFormats.includes(file.type)) {
      throw new Error('Formato no soportado. Usa JPG, PNG o WebP');
    }

    return true;
  }

  /**
   * Compresses an image file before upload
   * @param file - The image file to compress
   * @param maxWidth - Maximum width (default: 800px)
   * @param quality - Image quality 0-1 (default: 0.8)
   * @returns Promise with compressed file
   */
  async compressImage(file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        // Draw and compress
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob!], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          file.type,
          quality,
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }
}
