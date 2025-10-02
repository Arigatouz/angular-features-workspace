import {Component, inject, ViewChild, ElementRef, effect, afterRenderEffect, computed, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
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
import {MatSliderModule} from '@angular/material/slider';
import {TextFieldModule} from '@angular/cdk/text-field';
import {MatChipsModule} from '@angular/material/chips';
import {VideoUnderstandingService, VideoUnderstandingError} from '../../services/video-understanding.service';
import {ApiKeyService} from '../../services/api-key.service';
import {ApiKeyModalComponent} from '../api-key-modal/api-key-modal.component';
import {MarkdownPipe} from '../../pipes/markdown.pipe';

@Component({
  selector: 'app-video-understanding',
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
    MatProgressBarModule,
    MatDividerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatListModule,
    MatMenuModule,
    MatDialogModule,
    MatBadgeModule,
    MatSliderModule,
    TextFieldModule,
    MatChipsModule,
    MarkdownPipe,
  ],
  providers: [VideoUnderstandingService],
  templateUrl: './video-understanding.html',
  styleUrl: './video-understanding.scss'
})
export class VideoUnderstanding {
  @ViewChild('analysisHistoryContainer') analysisHistoryContainer!: ElementRef;

  readonly videoUnderstandingService = inject(VideoUnderstandingService);
  readonly apiKeyService = inject(ApiKeyService);
  readonly dialog = inject(MatDialog);
  readonly snackBar = inject(MatSnackBar);

  readonly modelOptions = [
    {id: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash Experimental'},
    {id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash'},
  ];

  readonly promptTemplates = [
    {id: 'summary', label: 'Summarize Video', prompt: 'Please summarize the video in 3 sentences.'},
    {id: 'detailed', label: 'Detailed Analysis', prompt: 'Provide a detailed analysis of this video including key topics, main points, and important insights.'},
    {id: 'questions', label: 'Generate Questions', prompt: 'Generate 5 thoughtful questions about the content of this video.'},
    {id: 'transcript', label: 'Key Quotes', prompt: 'Extract the most important quotes and key statements from this video.'},
    {id: 'custom', label: 'Custom Prompt', prompt: ''},
  ];

  fb = inject(NonNullableFormBuilder);
  form = this.fb.group({
    videoUrl: ['', [Validators.required, this.youtubeUrlValidator]],
    promptTemplate: ['summary', Validators.required],
    customPrompt: ['', []],
    model: [this.modelOptions[0].id, Validators.required],
    thinkingBudget: [4096, [Validators.min(0), Validators.max(8192)]],
  });

  protected loading = signal(false);
  protected error = signal<VideoUnderstandingError | null>(null);

  // Service state exposure
  readonly serviceError = this.videoUnderstandingService.lastError;
  readonly isServiceInitialized = this.videoUnderstandingService.isInitialized;
  readonly isServiceGenerating = this.videoUnderstandingService.isGenerating;
  readonly analyzedVideos = this.videoUnderstandingService.analyzedVideos;

  // Computed properties for UI
  readonly totalAnalyzedVideos = computed(() => this.analyzedVideos().length);
  readonly selectedTemplate = computed(() => {
    const templateId = this.form.get('promptTemplate')?.value;
    return this.promptTemplates.find(t => t.id === templateId);
  });

  constructor() {
    // Check for API key and show modal if needed
    effect(() => {
      // Wait a tick for services to initialize
      setTimeout(() => {
        if (!this.apiKeyService.hasApiKey()) {
          this.showApiKeyModal();
        }
      }, 100);
    });

    // Auto-scroll effect when analysis history changes
    afterRenderEffect(() => {
      if (this.analyzedVideos().length > 0) {
        this.scrollToBottom();
      }
    });

    // Watch for prompt template changes
    effect(() => {
      const template = this.selectedTemplate();
      if (template && template.id !== 'custom') {
        this.form.patchValue({ customPrompt: template.prompt });
      }
    });
  }

  private scrollToBottom(): void {
    try {
      setTimeout(() => {
        const container = this.analysisHistoryContainer?.nativeElement;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 100);
    } catch(err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  youtubeUrlValidator(control: any) {
    if (!control.value) return null;
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=|embed\/|v\/)?([a-zA-Z0-9_-]{11})(\S+)?$/;
    return youtubeRegex.test(control.value) ? null : { invalidYouTubeUrl: true };
  }

  async analyzeVideo() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showError('Please fix form errors before submitting.');
      return;
    }

    if (!this.isServiceInitialized()) {
      this.showError('Video analysis service is not initialized. Please check your API key configuration.');
      return;
    }

    const {videoUrl, customPrompt, model, thinkingBudget} = this.form.getRawValue();

    if (!customPrompt.trim()) {
      this.showError('Please enter a prompt for video analysis.');
      return;
    }

    try {
      this.loading.set(true);
      this.error.set(null);
      this.videoUnderstandingService.clearError();

      const response = await this.videoUnderstandingService.analyzeVideo({
        videoUrl: videoUrl,
        prompt: customPrompt,
        model: model,
        thinkingBudget: thinkingBudget
      });

      this.showSuccess('Video analyzed successfully!');

      // Clear the URL input after successful analysis
      this.form.patchValue({ videoUrl: '' });

      // Scroll to show new analysis in history
      this.scrollToBottom();

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to analyze video';
      this.error.set({
        message: errorMessage,
        type: 'UNKNOWN_ERROR',
        timestamp: new Date()
      });
      this.showError(errorMessage);
      console.error('Video analysis error:', error);
    } finally {
      this.loading.set(false);
    }
  }

  getThumbnailUrl(videoUrl: string): string | null {
    return this.videoUnderstandingService.getThumbnailUrl(videoUrl);
  }

  getVideoId(videoUrl: string): string | null {
    return this.videoUnderstandingService.getVideoId(videoUrl);
  }

  clearUrl() {
    this.form.patchValue({videoUrl: ''});
  }

  onPromptTemplateChange() {
    const template = this.selectedTemplate();
    if (template && template.id !== 'custom') {
      this.form.patchValue({ customPrompt: template.prompt });
    } else if (template?.id === 'custom') {
      this.form.patchValue({ customPrompt: '' });
    }
  }

  stop() {
    this.videoUnderstandingService.cancelCurrentRequest();
    this.loading.set(false);
    this.showSuccess('Video analysis stopped successfully.');
  }

  copyAnalysis(analysis: string) {
    if (!analysis) {
      this.showError('No analysis to copy');
      return;
    }

    navigator.clipboard?.writeText(analysis)
      .then(() => this.showSuccess('Analysis copied to clipboard!'))
      .catch(() => this.showError('Failed to copy analysis to clipboard'));
  }

  copyVideoUrl(url: string) {
    if (!url) {
      this.showError('No URL to copy');
      return;
    }

    navigator.clipboard?.writeText(url)
      .then(() => this.showSuccess('Video URL copied to clipboard!'))
      .catch(() => this.showError('Failed to copy URL to clipboard'));
  }

  clearAllAnalyses() {
    if (confirm('Are you sure you want to clear all video analysis history? This action cannot be undone.')) {
      this.videoUnderstandingService.clearAnalyzedVideos();
      this.showSuccess('All analysis history cleared');
    }
  }

  removeAnalysis(index: number) {
    if (confirm('Remove this analysis from history?')) {
      this.videoUnderstandingService.removeAnalyzedVideo(index);
      this.showSuccess('Analysis removed from history');
    }
  }

  openVideoInNewTab(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer');
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
      this.analyzeVideo();
    }
  }

  dismissError() {
    this.error.set(null);
    this.videoUnderstandingService.clearError();
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.analyzeVideo();
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
        this.showSuccess('API key set successfully! You can now analyze videos.');
      } else if (!this.apiKeyService.hasApiKey()) {
        this.showError('API key is required to use video analysis.');
        setTimeout(() => this.showApiKeyModal(), 2000);
      }
    });
  }

  changeApiKey() {
    this.showApiKeyModal();
  }

  getApiKeyStatus(): string {
    const info = this.apiKeyService.getApiKeyInfo();
    if (!info.exists) return 'No API key set';
    if (info.validated) return `API key: ${info.masked} (validated)`;
    return `API key: ${info.masked} (needs validation)`;
  }
}