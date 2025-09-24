import {Component, inject, ViewChild, ElementRef, effect, afterRenderEffect, computed, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatCardModule} from '@angular/material/card';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatDividerModule} from '@angular/material/divider';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatListModule} from '@angular/material/list';
import {MatMenuModule} from '@angular/material/menu';
import {MatDialogModule, MatDialog} from '@angular/material/dialog';
import {MatBadgeModule} from '@angular/material/badge';
import {MatTabsModule} from '@angular/material/tabs';
import {TextFieldModule} from '@angular/cdk/text-field';
import {MatChipsModule} from '@angular/material/chips';
import {ImageEditingService, ImageEditingError, EditedImage, ImageEditingRequest} from '../../services/image-editing.service';
import {ApiKeyService} from '../../services/api-key.service';
import {ApiKeyModalComponent} from '../api-key-modal/api-key-modal.component';

@Component({
  selector: 'app-image-editing',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressBarModule,
    MatDividerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatListModule,
    MatMenuModule,
    MatDialogModule,
    MatBadgeModule,
    MatTabsModule,
    TextFieldModule,
    MatChipsModule,
  ],
  providers: [ImageEditingService],
  templateUrl: './image-editing.html',
  styleUrl: './image-editing.scss'
})
export class ImageEditingComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('historyContainer') historyContainer!: ElementRef;
  @ViewChild('originalImage') originalImage!: ElementRef<HTMLImageElement>;
  @ViewChild('editedImage') editedImage!: ElementRef<HTMLImageElement>;

  readonly imageEditingService = inject(ImageEditingService);
  readonly apiKeyService = inject(ApiKeyService);
  readonly dialog = inject(MatDialog);
  readonly snackBar = inject(MatSnackBar);

  readonly promptSuggestions = [
    'Add a wizard hat to the subject',
    'Change the background to a beautiful sunset',
    'Add sunglasses to the person',
    'Turn this into a watercolor painting style',
    'Add snow falling in the background',
    'Make the image black and white with a vintage feel',
    'Add colorful butterflies around the subject',
    'Change the lighting to golden hour',
    'Add a rainbow in the background',
    'Make it look like a professional portrait'
  ];

  fb = inject(NonNullableFormBuilder);

  // Edit form
  editForm = this.fb.group({
    prompt: ['', [Validators.required, Validators.minLength(5)]],
  });

  protected loading = signal(false);
  protected error = signal<ImageEditingError | null>(null);
  protected selectedFile = signal<File | null>(null);
  protected isDragging = signal(false);
  protected originalImageUrl = signal<string | null>(null);
  protected editedImageUrl = signal<string | null>(null);
  protected currentEditingResult = signal<EditedImage | null>(null);

  // Service state exposure
  readonly serviceError = this.imageEditingService.lastError;
  readonly isServiceInitialized = this.imageEditingService.isInitialized;
  readonly isProcessing = this.imageEditingService.isProcessing;
  readonly editingHistory = this.imageEditingService.editingHistory;

  // Computed properties for UI
  readonly totalEditedImages = computed(() => this.editingHistory().length);
  readonly canEdit = computed(() =>
    this.selectedFile() !== null &&
    this.editForm.valid &&
    this.isServiceInitialized() &&
    !this.isProcessing()
  );
  readonly hasResults = computed(() => this.currentEditingResult() !== null);

  constructor() {
    // Check for API key and show modal if needed
    effect(() => {
      setTimeout(() => {
        if (!this.apiKeyService.hasApiKey()) {
          this.showApiKeyModal();
        }
      }, 100);
    });

    // Auto-scroll effect when editing history changes
    afterRenderEffect(() => {
      if (this.editingHistory().length > 0) {
        this.scrollToBottom();
      }
    });
  }

  private scrollToBottom(): void {
    try {
      setTimeout(() => {
        const container = this.historyContainer?.nativeElement;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 100);
    } catch(err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  // File handling methods
  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (this.isImageFile(file)) {
        this.selectedFile.set(file);
        this.createImagePreview(file);
        this.clearResults();
      } else {
        this.showError('Please select a valid image file (PNG, JPG, JPEG, WebP, GIF).');
        this.clearSelectedFile();
      }
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files[0]) {
      const file = files[0];
      if (this.isImageFile(file)) {
        this.selectedFile.set(file);
        this.createImagePreview(file);
        this.clearResults();
      } else {
        this.showError('Please drop a valid image file (PNG, JPG, JPEG, WebP, GIF).');
      }
    }
  }

  private isImageFile(file: File): boolean {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    return allowedTypes.includes(file.type);
  }

  private createImagePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      this.originalImageUrl.set(result);
    };
    reader.readAsDataURL(file);
  }

  clearSelectedFile(): void {
    this.selectedFile.set(null);
    this.originalImageUrl.set(null);
    this.clearResults();
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  private clearResults(): void {
    this.editedImageUrl.set(null);
    this.currentEditingResult.set(null);
  }

  // Image editing methods
  async editImage(): Promise<void> {
    const file = this.selectedFile();
    if (!file) {
      this.showError('Please select an image first.');
      return;
    }

    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      this.showError('Please enter a valid editing prompt.');
      return;
    }

    if (!this.isServiceInitialized()) {
      this.showError('Image editing service is not initialized. Please check your API key configuration.');
      return;
    }

    const prompt = this.editForm.get('prompt')?.value || '';

    try {
      this.loading.set(true);
      this.error.set(null);
      this.imageEditingService.clearError();

      const request: ImageEditingRequest = {
        imageFile: file,
        prompt: prompt
      };

      const response = await this.imageEditingService.editImage(request);

      // Convert base64 to blob URL for display
      const editedBlob = this.base64ToBlob(response.editedImageData, response.mimeType);
      const editedUrl = URL.createObjectURL(editedBlob);
      this.editedImageUrl.set(editedUrl);

      // Store the result for download
      const editedImage: EditedImage = {
        originalImageData: response.originalImageData,
        editedImageData: response.editedImageData,
        prompt: response.prompt,
        originalFileName: response.originalFileName,
        mimeType: response.mimeType,
        timestamp: response.timestamp,
        model: response.model
      };
      this.currentEditingResult.set(editedImage);

      this.showSuccess('Image edited successfully!');

      // Clear the prompt after successful editing
      this.editForm.patchValue({ prompt: '' });

      // Scroll to show new result in history
      this.scrollToBottom();

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to edit image';
      this.error.set({
        message: errorMessage,
        type: 'UNKNOWN_ERROR',
        timestamp: new Date()
      });
      this.showError(errorMessage);
      console.error('Image editing error:', error);
    } finally {
      this.loading.set(false);
    }
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  // Utility methods
  useSuggestion(suggestion: string): void {
    const promptControl = this.editForm.get('prompt');
    promptControl?.setValue(suggestion);
    promptControl?.markAsTouched();
    promptControl?.updateValueAndValidity();
  }

  async downloadCurrentResult(): Promise<void> {
    const result = this.currentEditingResult();
    if (!result) {
      this.showError('No edited image to download');
      return;
    }

    try {
      await this.imageEditingService.downloadImage(result);
      this.showSuccess('Image downloaded successfully!');
    } catch (error) {
      this.showError('Failed to download image');
      console.error('Download error:', error);
    }
  }

  async downloadFromHistory(editedImage: EditedImage): Promise<void> {
    try {
      await this.imageEditingService.downloadImage(editedImage);
      this.showSuccess('Image downloaded successfully!');
    } catch (error) {
      this.showError('Failed to download image');
      console.error('Download error:', error);
    }
  }

  viewImageFromHistory(editedImage: EditedImage): void {
    // Set current result to show the selected image
    this.currentEditingResult.set(editedImage);

    // Create blob URLs for display
    const originalBlob = this.base64ToBlob(editedImage.originalImageData, editedImage.mimeType);
    const editedBlob = this.base64ToBlob(editedImage.editedImageData, editedImage.mimeType);

    const originalUrl = URL.createObjectURL(originalBlob);
    const editedUrl = URL.createObjectURL(editedBlob);

    this.originalImageUrl.set(originalUrl);
    this.editedImageUrl.set(editedUrl);

    // Update the form prompt
    this.editForm.patchValue({ prompt: editedImage.prompt });
  }

  removeFromHistory(index: number): void {
    if (confirm('Remove this edited image from history?')) {
      this.imageEditingService.removeFromHistory(index);
      this.showSuccess('Image removed from history');
    }
  }

  clearEditingHistory(): void {
    if (confirm('Are you sure you want to clear all editing history? This action cannot be undone.')) {
      this.imageEditingService.clearEditingHistory();
      this.showSuccess('Editing history cleared');
    }
  }

  stop(): void {
    this.imageEditingService.cancelCurrentRequest();
    this.loading.set(false);
    this.showSuccess('Image editing stopped successfully.');
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  retry(): void {
    if (this.canEdit() && !this.loading()) {
      this.editImage();
    }
  }

  dismissError(): void {
    this.error.set(null);
    this.imageEditingService.clearError();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && event.ctrlKey && !event.shiftKey) {
      event.preventDefault();
      this.editImage();
    }
  }

  // API Key Management Methods
  showApiKeyModal(): void {
    const dialogRef = this.dialog.open(ApiKeyModalComponent, {
      width: '550px',
      height: '600px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      disableClose: !this.apiKeyService.hasApiKey(),
      panelClass: 'api-key-modal-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.valid && result?.apiKey) {
        this.apiKeyService.setApiKey(result.apiKey, true);
        this.showSuccess('API key set successfully! You can now edit images.');
      } else if (!this.apiKeyService.hasApiKey()) {
        this.showError('API key is required to use image editing.');
        setTimeout(() => this.showApiKeyModal(), 2000);
      }
    });
  }

  changeApiKey(): void {
    this.showApiKeyModal();
  }

  getApiKeyStatus(): string {
    const info = this.apiKeyService.getApiKeyInfo();
    if (!info.exists) return 'No API key set';
    if (info.validated) return `API key: ${info.masked} (validated)`;
    return `API key: ${info.masked} (needs validation)`;
  }

  getFileSize(file: File): string {
    const bytes = file.size;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Cleanup
  ngOnDestroy(): void {
    // Clean up blob URLs to prevent memory leaks
    const originalUrl = this.originalImageUrl();
    const editedUrl = this.editedImageUrl();

    if (originalUrl && originalUrl.startsWith('blob:')) {
      URL.revokeObjectURL(originalUrl);
    }
    if (editedUrl && editedUrl.startsWith('blob:')) {
      URL.revokeObjectURL(editedUrl);
    }
  }
}