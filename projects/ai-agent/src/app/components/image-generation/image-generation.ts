import {Component, inject, Injector, signal, ViewChild, ElementRef, AfterViewInit, OnInit, effect, afterRenderEffect, computed} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatCardModule} from '@angular/material/card';
import {MatSliderModule} from '@angular/material/slider';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatDividerModule} from '@angular/material/divider';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatChipsModule} from '@angular/material/chips';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatMenuModule} from '@angular/material/menu';
import {TextFieldModule} from '@angular/cdk/text-field';
import {ImageGenAiService, ImageGenerationError} from '../../services/image-gen-ai';
import {ApiKeyService} from '../../services/api-key.service';
import {MatDialog} from '@angular/material/dialog';
import {ApiKeyModalComponent} from '../api-key-modal/api-key-modal.component';

@Component({
  selector: 'app-image-generation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSliderModule,
    MatProgressBarModule,
    MatDividerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatChipsModule,
    MatGridListModule,
    MatMenuModule,
    TextFieldModule,
  ],
  providers: [ImageGenAiService],
  templateUrl: './image-generation.html',
  styleUrl: './image-generation.scss'
})
export class ImageGeneration implements AfterViewInit, OnInit {
  @ViewChild('galleryContainer') galleryContainer!: ElementRef;

  DEFAULT_PROMPT = 'A serene landscape with mountains and a lake at sunset';

  readonly imageGenAiService = inject(ImageGenAiService);
  readonly apiKeyService = inject(ApiKeyService);
  readonly dialog = inject(MatDialog);
  readonly snackBar = inject(MatSnackBar);

  readonly styleOptions = [
    {id: 'realistic', label: 'Realistic'},
    {id: 'artistic', label: 'Artistic'},
    {id: 'cartoon', label: 'Cartoon'},
    {id: 'photographic', label: 'Photographic'},
  ];

  readonly sizeOptions = [
    {id: '512x512', label: 'Square (512×512)'},
    {id: '1024x1024', label: 'Large Square (1024×1024)'},
    {id: '1024x1792', label: 'Portrait (1024×1792)'},
    {id: '1792x1024', label: 'Landscape (1792×1024)'},
  ];

  readonly qualityOptions = [
    {id: 'standard', label: 'Standard'},
    {id: 'hd', label: 'HD'},
  ];

  fb = inject(NonNullableFormBuilder);
  form = this.fb.group({
    prompt: [this.DEFAULT_PROMPT, [Validators.required, Validators.minLength(3)]],
    style: ['realistic', Validators.required],
    size: ['512x512', Validators.required],
    quality: ['standard', Validators.required],
    count: [1, [Validators.min(1), Validators.max(4)]],
  });

  protected loading = signal(false);
  protected error = signal<ImageGenerationError | null>(null);
  protected settingsExpanded = signal(true);

  // Image generation specific state
  readonly generatedImages = this.imageGenAiService.generatedImages;
  readonly hasGeneratedImages = computed(() => this.generatedImages().length > 0);

  // Expose service state to template
  readonly serviceError = this.imageGenAiService.lastError;
  readonly isServiceInitialized = this.imageGenAiService.isInitialized;
  readonly isServiceGenerating = this.imageGenAiService.isGenerating;

  readonly #injector = inject(Injector);

  constructor() {
    // Auto-scroll effect when new images are generated
    afterRenderEffect(() => {
      if (this.generatedImages().length > 0) {
        this.scrollToTop();
      }
    }, { injector: this.#injector });

    // Check for API key and show modal if needed
    effect(() => {
      setTimeout(() => {
        if (!this.apiKeyService.hasApiKey()) {
          this.showApiKeyModal();
        }
      }, 100);
    }, { injector: this.#injector });
  }

  async ngOnInit() {
    // Keep ngOnInit for compatibility but move logic to effects
  }

  ngAfterViewInit() {
    // Auto-scroll is now handled by afterRenderEffect
  }

  private scrollToTop(): void {
    try {
      setTimeout(() => {
        if (this.galleryContainer?.nativeElement) {
          const container = this.galleryContainer.nativeElement;
          container.scrollTop = 0;
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
    } catch(err) {
      console.error('Error scrolling to top:', err);
    }
  }

  async generateImages() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showError('Please fix form errors before submitting.');
      return;
    }

    if (!this.isServiceInitialized()) {
      this.showError('AI service is not initialized. Please check your API key configuration.');
      return;
    }

    const {prompt, style, size, quality, count} = this.form.getRawValue();

    try {
      this.loading.set(true);
      this.error.set(null);
      this.imageGenAiService.clearError();

      // Disable form during generation
      this.form.get('prompt')?.disable();

      const response = await this.imageGenAiService.generateImage({
        prompt: prompt,
        style: style as any,
        size: size as any,
        quality: quality as any,
        count: count,
        model: 'imagen-2' // Default model for nano banana approach
      });

      this.showSuccess(`Successfully generated ${response.images.length} image${response.images.length > 1 ? 's' : ''}!`);

      // Scroll to show new images
      this.scrollToTop();

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to generate images';
      this.error.set({
        message: errorMessage,
        type: 'UNKNOWN_ERROR',
        timestamp: new Date()
      });
      this.showError(errorMessage);
      console.error('Image generation error:', error);
    } finally {
      this.loading.set(false);
      // Re-enable form after generation
      this.form.get('prompt')?.enable();
    }
  }

  clear() {
    this.form.patchValue({prompt: ''});
  }

  stop() {
    this.imageGenAiService.cancelCurrentRequest();
    this.loading.set(false);
    // Re-enable form when stopping
    this.form.get('prompt')?.enable();
    this.showSuccess('Image generation stopped successfully.');
  }

  toggleSettings() {
    this.settingsExpanded.set(!this.settingsExpanded());
  }

  clearAllImages() {
    if (confirm('Are you sure you want to clear all generated images? This action cannot be undone.')) {
      this.imageGenAiService.clearGeneratedImages();
      this.showSuccess('All images cleared successfully.');
    }
  }

  removeImage(index: number) {
    this.imageGenAiService.removeGeneratedImage(index);
    this.showSuccess('Image removed successfully.');
  }

  downloadImage(imageUrl: string, prompt: string) {
    try {
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `ai-generated-${Date.now()}.jpg`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';

      // Trigger the download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.showSuccess('Image download started!');
    } catch (error) {
      this.showError('Failed to download image. You can right-click and save instead.');
      console.error('Download error:', error);
    }
  }

  copyImageUrl(imageUrl: string) {
    navigator.clipboard?.writeText(imageUrl)
      .then(() => this.showSuccess('Image URL copied to clipboard!'))
      .catch(() => this.showError('Failed to copy image URL to clipboard'));
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

  retry() {
    if (this.form.valid && !this.loading()) {
      this.generateImages();
    }
  }

  dismissError() {
    this.error.set(null);
    this.imageGenAiService.clearError();
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault();
      this.generateImages();
    } else if (event.key === 'Escape') {
      this.clear();
    }
  }

  // API Key Management Methods
  showApiKeyModal() {
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
        this.showSuccess('API key set successfully! You can now generate images.');
      } else if (!this.apiKeyService.hasApiKey()) {
        this.showError('API key is required to use the AI image generator.');
        setTimeout(() => this.showApiKeyModal(), 2000);
      }
    });
  }

  changeApiKey() {
    this.showApiKeyModal();
  }

  clearApiKey() {
    if (confirm('Are you sure you want to clear your API key? You will need to enter it again to generate images.')) {
      this.apiKeyService.clearApiKey();
      this.showSuccess('API key cleared. You can set a new one anytime.');
    }
  }

  getApiKeyStatus(): string {
    const info = this.apiKeyService.getApiKeyInfo();
    if (!info.exists) return 'No API key set';
    if (info.validated) return `API key: ${info.masked} (validated)`;
    return `API key: ${info.masked} (needs validation)`;
  }

  // Utility methods for template
  getImageAlt(response: any, index: number): string {
    return `AI generated image ${index + 1}: ${response.prompt}`;
  }

  getFormattedPrompt(prompt: string): string {
    return prompt.length > 100 ? prompt.substring(0, 100) + '...' : prompt;
  }
}