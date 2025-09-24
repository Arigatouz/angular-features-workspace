import { Injectable, signal, inject, effect } from '@angular/core';
import { GoogleGenAI } from '@google/genai';
import { ApiKeyService } from './api-key.service';

export interface ImageEditingError {
  message: string;
  type: 'API_KEY_MISSING' | 'NETWORK_ERROR' | 'RATE_LIMIT' | 'INVALID_REQUEST' | 'IMAGE_PROCESSING_FAILED' | 'UNKNOWN_ERROR';
  timestamp: Date;
}

export interface ImageEditingRequest {
  imageFile: File;
  prompt: string;
}

export interface EditedImage {
  originalImageData: string; // base64
  editedImageData: string; // base64
  prompt: string;
  originalFileName: string;
  mimeType: string;
  timestamp: Date;
  model: string;
}

export interface ImageEditingResponse {
  editedImageData: string; // base64
  originalImageData: string; // base64
  prompt: string;
  originalFileName: string;
  mimeType: string;
  timestamp: Date;
  model: string;
}

@Injectable({
  providedIn: 'root'
})
export class ImageEditingService {
  private readonly apiKeyService = inject(ApiKeyService);

  private ai?: GoogleGenAI;
  private currentAbortController?: AbortController;
  readonly isInitialized = signal(false);
  readonly lastError = signal<ImageEditingError | null>(null);
  readonly isProcessing = signal(false);

  // Image editing specific state
  readonly editingHistory = signal<EditedImage[]>([]);

  constructor() {
    // React to API key changes
    effect(() => {
      const apiKey = this.apiKeyService.apiKey();
      if (apiKey) {
        this.initializeAI(apiKey);
      } else {
        this.resetService();
      }
    });
  }

  private initializeAI(apiKey: string): void {
    try {
      if (!apiKey) {
        this.setError('API key is missing. Please provide your Google AI API key.', 'API_KEY_MISSING');
        return;
      }

      this.ai = new GoogleGenAI({
        apiKey: apiKey
      });

      this.isInitialized.set(true);
      this.clearError();
    } catch (error) {
      console.error('Failed to initialize Google Gen AI for image editing:', error);
      this.setError('Failed to initialize AI image editing service. Please check your API key.', 'API_KEY_MISSING');
    }
  }

  private resetService(): void {
    this.ai = undefined;
    this.isInitialized.set(false);
    this.isProcessing.set(false);
    this.currentAbortController?.abort();
    this.currentAbortController = undefined;
    this.setError('Please provide your Google AI API key to start editing images.', 'API_KEY_MISSING');
  }

  isReady(): boolean {
    return this.isInitialized() && !!this.ai && this.apiKeyService.hasApiKey();
  }

  async editImage(request: ImageEditingRequest): Promise<ImageEditingResponse> {
    if (!this.ai || !this.isReady()) {
      throw new Error('AI image editing service not ready. Please provide a valid API key.');
    }

    // Cancel any existing request
    this.cancelCurrentRequest();

    // Create new abort controller for this request
    this.currentAbortController = new AbortController();
    const abortSignal = this.currentAbortController.signal;

    try {
      this.isProcessing.set(true);
      this.lastError.set(null);

      // Check if request was cancelled before starting
      if (abortSignal.aborted) {
        throw new Error('Request was cancelled');
      }

      // Convert image file to base64
      const imageData = await this.fileToBase64(request.imageFile);

      // Check if request was cancelled during conversion
      if (abortSignal.aborted) {
        throw new Error('Request was cancelled');
      }

      // Prepare the prompt for image editing
      const prompt = [
        { text: request.prompt },
        {
          inlineData: {
            mimeType: request.imageFile.type,
            data: imageData,
          },
        },
      ];

      // Check if request was cancelled before API call
      if (abortSignal.aborted) {
        throw new Error('Request was cancelled');
      }

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: prompt,
      });

      // Check if request was cancelled during generation
      if (abortSignal.aborted) {
        throw new Error('Request was cancelled');
      }

      if (!response?.candidates?.[0]?.content?.parts) {
        throw new Error('No edited image received from the AI model.');
      }

      // Find the edited image in the response parts
      let editedImageData = '';
      let hasTextResponse = false;

      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          hasTextResponse = true;
          console.log('AI response text:', part.text);
        } else if (part.inlineData?.data) {
          editedImageData = part.inlineData.data;
          break;
        }
      }

      if (!editedImageData) {
        if (hasTextResponse) {
          throw new Error('AI responded with text instead of an edited image. The requested modification might not be possible or the model may have declined to edit the image.');
        } else {
          throw new Error('No edited image data received from the AI model.');
        }
      }

      // Mark API key as validated on successful generation
      this.apiKeyService.markAsValidated();

      const imageEditingResponse: ImageEditingResponse = {
        editedImageData: editedImageData,
        originalImageData: imageData,
        prompt: request.prompt,
        originalFileName: request.imageFile.name,
        mimeType: request.imageFile.type,
        timestamp: new Date(),
        model: 'gemini-2.5-flash-image-preview'
      };

      // Add to editing history
      const editedImage: EditedImage = {
        originalImageData: imageData,
        editedImageData: editedImageData,
        prompt: request.prompt,
        originalFileName: request.imageFile.name,
        mimeType: request.imageFile.type,
        timestamp: new Date(),
        model: 'gemini-2.5-flash-image-preview'
      };

      const currentHistory = this.editingHistory();
      this.editingHistory.set([editedImage, ...currentHistory]);

      return imageEditingResponse;

    } catch (error: any) {
      // Don't log cancellation errors
      if (error.name === 'AbortError' || error.message?.includes('cancelled')) {
        throw new Error('Request was cancelled by user');
      }

      let errorType: ImageEditingError['type'] = 'UNKNOWN_ERROR';
      let errorMessage = 'An unexpected error occurred while editing the image.';

      if (error.message?.includes('API key') || error.message?.includes('PERMISSION_DENIED')) {
        errorType = 'API_KEY_MISSING';
        errorMessage = 'Invalid or unauthorized API key. Please check your API key.';
        this.apiKeyService.markAsInvalid();
      } else if (error.message?.includes('rate limit') || error.message?.includes('quota')) {
        errorType = 'RATE_LIMIT';
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorType = 'NETWORK_ERROR';
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message?.includes('invalid') || error.message?.includes('bad request')) {
        errorType = 'INVALID_REQUEST';
        errorMessage = 'Invalid request. Please check your image and prompt.';
      } else if (error.message?.includes('text instead') || error.message?.includes('declined')) {
        errorType = 'IMAGE_PROCESSING_FAILED';
        errorMessage = error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      this.setError(errorMessage, errorType);
      throw error;
    } finally {
      this.isProcessing.set(false);
      this.currentAbortController = undefined;
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:image/xxx;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  }

  async downloadImage(editedImage: EditedImage): Promise<void> {
    try {
      const imageData = editedImage.editedImageData;
      const originalFileName = editedImage.originalFileName;

      // Convert base64 to blob
      const byteCharacters = atob(imageData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      const blob = new Blob([byteArray], { type: editedImage.mimeType });
      const url = URL.createObjectURL(blob);

      // Generate filename
      const fileExtension = originalFileName.split('.').pop() || 'png';
      const baseName = originalFileName.replace(/\.[^/.]+$/, '');
      const filename = `${baseName}_edited_${editedImage.timestamp.toISOString().slice(0, 19).replace(/:/g, '-')}.${fileExtension}`;

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download edited image:', error);
      throw new Error('Failed to download edited image');
    }
  }

  cancelCurrentRequest(): void {
    if (this.currentAbortController && !this.currentAbortController.signal.aborted) {
      this.currentAbortController.abort();
      this.isProcessing.set(false);
    }
  }

  private setError(message: string, type: ImageEditingError['type']): void {
    this.lastError.set({
      message,
      type,
      timestamp: new Date()
    });
  }

  clearError(): void {
    this.lastError.set(null);
  }

  removeFromHistory(index: number): void {
    const currentHistory = this.editingHistory();
    const updatedHistory = currentHistory.filter((_, i) => i !== index);
    this.editingHistory.set(updatedHistory);
  }

  clearEditingHistory(): void {
    this.editingHistory.set([]);
  }

  getEditingHistory(): EditedImage[] {
    return this.editingHistory();
  }
}