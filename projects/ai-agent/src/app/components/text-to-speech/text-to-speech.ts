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
import {TextFieldModule} from '@angular/cdk/text-field';
import {MatChipsModule} from '@angular/material/chips';
import {TextToSpeechService, TextToSpeechError, TextToSpeechResponse} from '../../services/text-to-speech.service';
import {ApiKeyService} from '../../services/api-key.service';
import {ApiKeyModalComponent} from '../api-key-modal/api-key-modal.component';

@Component({
  selector: 'app-text-to-speech',
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
    TextFieldModule,
    MatChipsModule,
  ],
  providers: [TextToSpeechService],
  templateUrl: './text-to-speech.html',
  styleUrl: './text-to-speech.scss'
})
export class TextToSpeechGeneration {
  @ViewChild('audioHistoryContainer') audioHistoryContainer!: ElementRef;

  DEFAULT_TEXT = 'Say cheerfully: Have a wonderful day!';

  readonly textToSpeechService = inject(TextToSpeechService);
  readonly apiKeyService = inject(ApiKeyService);
  readonly dialog = inject(MatDialog);
  readonly snackBar = inject(MatSnackBar);

  readonly voiceOptions = [
    {id: 'Kore', label: 'Kore (Default)'},
    {id: 'Charon', label: 'Charon'},
    {id: 'Fenrir', label: 'Fenrir'},
    {id: 'Aoede', label: 'Aoede'},
  ];

  fb = inject(NonNullableFormBuilder);
  form = this.fb.group({
    text: [this.DEFAULT_TEXT, [Validators.required, Validators.minLength(2)]],
    voiceName: [this.voiceOptions[0].id, Validators.required],
  });

  protected loading = signal(false);
  protected error = signal<TextToSpeechError | null>(null);
  protected currentlyPlayingIndex = signal<number | null>(null);
  protected audioElements = new Map<number, HTMLAudioElement>();

  // Service state exposure
  readonly serviceError = this.textToSpeechService.lastError;
  readonly isServiceInitialized = this.textToSpeechService.isInitialized;
  readonly isServiceGenerating = this.textToSpeechService.isGenerating;
  readonly generatedAudios = this.textToSpeechService.generatedAudios;

  // Computed properties for UI
  readonly totalGeneratedAudios = computed(() => this.generatedAudios().length);

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

    // Auto-scroll effect when audio history changes
    afterRenderEffect(() => {
      if (this.generatedAudios().length > 0) {
        this.scrollToBottom();
      }
    });
  }

  private scrollToBottom(): void {
    try {
      setTimeout(() => {
        const container = this.audioHistoryContainer?.nativeElement;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 100);
    } catch(err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  async generateSpeech() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showError('Please fix form errors before submitting.');
      return;
    }

    if (!this.isServiceInitialized()) {
      this.showError('TTS service is not initialized. Please check your API key configuration.');
      return;
    }

    const {text, voiceName} = this.form.getRawValue();

    try {
      this.loading.set(true);
      this.error.set(null);
      this.textToSpeechService.clearError();

      const response = await this.textToSpeechService.generateSpeech({
        text: text,
        voiceName: voiceName
      });

      this.showSuccess('Speech generated successfully!');

      // Clear the input after successful generation
      this.form.patchValue({ text: '' });

      // Scroll to show new audio in history
      this.scrollToBottom();

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to generate speech';
      this.error.set({
        message: errorMessage,
        type: 'UNKNOWN_ERROR',
        timestamp: new Date()
      });
      this.showError(errorMessage);
      console.error('Speech generation error:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async downloadAudio(audioResponse: any) {
    try {
      await this.textToSpeechService.downloadWavFile(audioResponse);
      this.showSuccess('Audio file downloaded successfully!');
    } catch (error) {
      console.error('Download failed:', error);
      this.showError('Failed to download audio file');
    }
  }

  async downloadAudioFromHistory(audioResponse: any) {
    try {
      await this.textToSpeechService.downloadWavFile(audioResponse);
      this.showSuccess('Audio file downloaded!');
    } catch (error) {
      console.error('Download failed:', error);
      this.showError('Failed to download audio file');
    }
  }

  clearText() {
    this.form.patchValue({text: ''});
  }

  stop() {
    this.textToSpeechService.cancelCurrentRequest();
    this.loading.set(false);
    this.showSuccess('Speech generation stopped successfully.');
  }

  copyText(text: string) {
    if (!text) {
      this.showError('No text to copy');
      return;
    }

    navigator.clipboard?.writeText(text)
      .then(() => this.showSuccess('Text copied to clipboard!'))
      .catch(() => this.showError('Failed to copy text to clipboard'));
  }

  clearAllAudios() {
    if (confirm('Are you sure you want to clear all generated audio history? This action cannot be undone.')) {
      this.textToSpeechService.clearGeneratedAudios();
      this.showSuccess('All audio history cleared');
    }
  }

  removeAudio(index: number) {
    if (confirm('Remove this audio from history?')) {
      this.textToSpeechService.removeGeneratedAudio(index);
      this.showSuccess('Audio removed from history');
    }
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
      this.generateSpeech();
    }
  }

  dismissError() {
    this.error.set(null);
    this.textToSpeechService.clearError();
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.generateSpeech();
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
        this.showSuccess('API key set successfully! You can now use text-to-speech.');
      } else if (!this.apiKeyService.hasApiKey()) {
        this.showError('API key is required to use text-to-speech.');
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

  // Audio playback methods
  async playAudio(audioResponse: TextToSpeechResponse, index: number) {
    try {
      // Stop any currently playing audio
      this.stopAllAudio();

      // Create audio blob from the PCM data
      const wavBuffer = await this.createWavBuffer(
        audioResponse.audioData,
        1, // mono
        24000, // sample rate
        2 // sample width (16-bit)
      );

      const blob = new Blob([wavBuffer], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(blob);

      const audioElement = document.createElement('audio');
      audioElement.src = audioUrl;
      audioElement.preload = 'auto';

      // Store audio element for cleanup
      this.audioElements.set(index, audioElement);

      // Set up event listeners
      audioElement.onplay = () => {
        this.currentlyPlayingIndex.set(index);
      };

      audioElement.onended = () => {
        this.currentlyPlayingIndex.set(null);
        this.cleanupAudioElement(index);
      };

      audioElement.onerror = () => {
        this.showError('Failed to play audio');
        this.currentlyPlayingIndex.set(null);
        this.cleanupAudioElement(index);
      };

      // Play the audio
      await audioElement.play();

    } catch (error) {
      console.error('Audio playback failed:', error);
      this.showError('Failed to play audio');
      this.currentlyPlayingIndex.set(null);
    }
  }

  stopAudio(index: number) {
    const audioElement = this.audioElements.get(index);
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      this.cleanupAudioElement(index);
    }
    if (this.currentlyPlayingIndex() === index) {
      this.currentlyPlayingIndex.set(null);
    }
  }

  stopAllAudio() {
    this.audioElements.forEach((audio, index) => {
      audio.pause();
      audio.currentTime = 0;
      this.cleanupAudioElement(index);
    });
    this.currentlyPlayingIndex.set(null);
  }

  private cleanupAudioElement(index: number) {
    const audioElement = this.audioElements.get(index);
    if (audioElement) {
      URL.revokeObjectURL(audioElement.src);
      this.audioElements.delete(index);
    }
  }

  isAudioPlaying(index: number): boolean {
    return this.currentlyPlayingIndex() === index;
  }

  /**
   * Create WAV buffer from PCM data (copied from service for component use)
   */
  private async createWavBuffer(
    pcmData: Uint8Array,
    channels: number = 1,
    sampleRate: number = 24000,
    sampleWidth: number = 2
  ): Promise<ArrayBuffer> {
    const byteRate = sampleRate * channels * sampleWidth;
    const blockAlign = channels * sampleWidth;
    const dataLength = pcmData.length;
    const headerLength = 44;
    const fileLength = headerLength + dataLength;

    const buffer = new ArrayBuffer(fileLength);
    const view = new DataView(buffer);
    let offset = 0;

    // WAV file header
    // "RIFF" chunk descriptor
    view.setUint32(offset, 0x52494646, false); offset += 4; // "RIFF"
    view.setUint32(offset, fileLength - 8, true); offset += 4; // file size - 8
    view.setUint32(offset, 0x57415645, false); offset += 4; // "WAVE"

    // "fmt " sub-chunk
    view.setUint32(offset, 0x666d7420, false); offset += 4; // "fmt "
    view.setUint32(offset, 16, true); offset += 4; // sub-chunk size
    view.setUint16(offset, 1, true); offset += 2; // audio format (PCM)
    view.setUint16(offset, channels, true); offset += 2; // number of channels
    view.setUint32(offset, sampleRate, true); offset += 4; // sample rate
    view.setUint32(offset, byteRate, true); offset += 4; // byte rate
    view.setUint16(offset, blockAlign, true); offset += 2; // block align
    view.setUint16(offset, sampleWidth * 8, true); offset += 2; // bits per sample

    // "data" sub-chunk
    view.setUint32(offset, 0x64617461, false); offset += 4; // "data"
    view.setUint32(offset, dataLength, true); offset += 4; // data length

    // PCM data
    const uint8View = new Uint8Array(buffer, offset);
    uint8View.set(pcmData);

    return buffer;
  }
}