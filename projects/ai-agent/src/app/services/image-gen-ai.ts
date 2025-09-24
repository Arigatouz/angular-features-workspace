import { Injectable, signal, inject, effect } from '@angular/core';
import { GoogleGenAI } from '@google/genai';
import { ApiKeyService } from './api-key.service';

export interface ImageGenerationError {
  message: string;
  type: 'API_KEY_MISSING' | 'NETWORK_ERROR' | 'RATE_LIMIT' | 'INVALID_REQUEST' | 'UNKNOWN_ERROR';
  timestamp: Date;
}

export interface ImageGenerationRequest {
  prompt: string;
  model?: string;
  style?: 'realistic' | 'artistic' | 'cartoon' | 'photographic';
  size?: '256x256' | '512x512' | '1024x1024' | '1024x1792' | '1792x1024';
  quality?: 'standard' | 'hd';
  count?: number;
}

export interface ImageGenerationResponse {
  images: {
    url: string;
    revisedPrompt?: string;
  }[];
  prompt: string;
  model: string;
  timestamp: Date;
  metadata: Omit<ImageGenerationRequest, 'prompt'>;
}

@Injectable({
  providedIn: 'root'
})
export class ImageGenAiService {
  private readonly apiKeyService = inject(ApiKeyService);

  private ai?: GoogleGenAI;
  private currentAbortController?: AbortController;
  readonly isInitialized = signal(false);
  readonly lastError = signal<ImageGenerationError | null>(null);
  readonly isGenerating = signal(false);

  // Image generation specific state
  readonly generatedImages = signal<ImageGenerationResponse[]>([]);

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
      this.clearError(); // Clear any previous errors when successfully initialized
    } catch (error) {
      console.error('Failed to initialize Google Gen AI for images:', error);
      this.setError('Failed to initialize AI image service. Please check your API key.', 'API_KEY_MISSING');
    }
  }

  /**
   * Reset the service state when no API key is available
   */
  private resetService(): void {
    this.ai = undefined;
    this.isInitialized.set(false);
    this.isGenerating.set(false);
    this.currentAbortController?.abort();
    this.currentAbortController = undefined;
    this.setError('Please provide your Google AI API key to start generating images.', 'API_KEY_MISSING');
  }

  /**
   * Check if the service is ready to use
   */
  isReady(): boolean {
    return this.isInitialized() && !!this.ai && this.apiKeyService.hasApiKey();
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    if (!this.ai || !this.isReady()) {
      throw new Error('AI image service not ready. Please provide a valid API key.');
    }

    // Cancel any existing request
    this.cancelCurrentRequest();

    // Create new abort controller for this request
    this.currentAbortController = new AbortController();
    const abortSignal = this.currentAbortController.signal;

    try {
      this.isGenerating.set(true);
      this.lastError.set(null);

      // Check if request was cancelled before starting
      if (abortSignal.aborted) {
        throw new Error('Request was cancelled');
      }

      // For nano banana approach, we'll simulate image generation
      // In a real implementation, this would call the actual image generation API
      const response = await this.simulateImageGeneration(request, abortSignal);

      // Check if request was cancelled during generation
      if (abortSignal.aborted) {
        throw new Error('Request was cancelled');
      }

      if (!response || !response.images || response.images.length === 0) {
        throw new Error('No images received from the AI model.');
      }

      // Mark API key as validated on successful generation
      this.apiKeyService.markAsValidated();

      // Add to generated images history
      const currentImages = this.generatedImages();
      this.generatedImages.set([response, ...currentImages]);

      return response;

    } catch (error: any) {
      // Don't log cancellation errors
      if (error.name === 'AbortError' || error.message?.includes('cancelled')) {
        throw new Error('Request was cancelled by user');
      }

      let errorType: ImageGenerationError['type'] = 'UNKNOWN_ERROR';
      let errorMessage = 'An unexpected error occurred while generating images.';

      if (error.message?.includes('API key') || error.message?.includes('PERMISSION_DENIED')) {
        errorType = 'API_KEY_MISSING';
        errorMessage = 'Invalid or unauthorized API key. Please check your API key.';
        // Mark API key as invalid
        this.apiKeyService.markAsInvalid();
      } else if (error.message?.includes('rate limit') || error.message?.includes('quota')) {
        errorType = 'RATE_LIMIT';
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorType = 'NETWORK_ERROR';
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message?.includes('invalid') || error.message?.includes('bad request')) {
        errorType = 'INVALID_REQUEST';
        errorMessage = 'Invalid request. Please check your input parameters.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      this.setError(errorMessage, errorType);
      throw error;
    } finally {
      this.isGenerating.set(false);
      this.currentAbortController = undefined;
    }
  }


  /**
   * Real Google Gemini AI image generation using gemini-2.5-flash-image-preview model
   */
  private async simulateImageGeneration(
    request: ImageGenerationRequest,
    abortSignal: AbortSignal
  ): Promise<ImageGenerationResponse> {
    if (!this.ai) {
      throw new Error('Google AI not initialized');
    }

    if (abortSignal.aborted) {
      throw new Error('Request was cancelled');
    }

    const count = request.count || 1;
    const images = [];

    // Generate images one by one (Gemini generates one image per request)
    for (let i = 0; i < count; i++) {
      if (abortSignal.aborted) {
        throw new Error('Request was cancelled');
      }

      try {
        // Enhance prompt with style and quality specifications
        const enhancedPrompt = this.enhancePromptWithStyle(request.prompt, request.style, request.quality, i);

        const response = await this.ai.models.generateContent({
          model: "gemini-2.5-flash-image-preview",
          contents: enhancedPrompt,
        });

        if (abortSignal.aborted) {
          throw new Error('Request was cancelled');
        }

        // Extract image data from response with proper null checks
        if (response.candidates && response.candidates[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
              const imageData = part.inlineData.data;
              const mimeType = part.inlineData.mimeType;

              // Create data URL for the image
              const dataUrl = `data:${mimeType};base64,${imageData}`;

              images.push({
                url: dataUrl,
                revisedPrompt: enhancedPrompt
              });
              break; // Only take the first image from the response
            }
          }
        }

        // If no image was found in the response, throw an error
        if (images.length <= i) {
          throw new Error('No image data received from Gemini model');
        }

      } catch (error: any) {
        // If this is an abort error, re-throw it
        if (error.message?.includes('cancelled') || abortSignal.aborted) {
          throw new Error('Request was cancelled');
        }

        // For other errors, provide more specific error messages
        let errorMessage = error.message || 'Failed to generate image';
        if (errorMessage.includes('PERMISSION_DENIED')) {
          errorMessage = 'API key does not have permission for image generation. Please check your Google AI Studio API key permissions.';
        } else if (errorMessage.includes('QUOTA_EXCEEDED')) {
          errorMessage = 'API quota exceeded. Please check your usage limits in Google AI Studio.';
        } else if (errorMessage.includes('MODEL_NOT_FOUND')) {
          errorMessage = 'Image generation model not available. Please ensure your API key has access to Gemini 2.5 Flash Image Preview.';
        }

        throw new Error(errorMessage);
      }
    }

    return {
      images,
      prompt: request.prompt,
      model: 'gemini-2.5-flash-image-preview',
      timestamp: new Date(),
      metadata: {
        style: request.style,
        size: request.size,
        quality: request.quality,
        count: request.count
      }
    };
  }

  /**
   * Enhance the prompt with style and quality specifications for better Gemini results
   */
  private enhancePromptWithStyle(
    basePrompt: string,
    style?: string,
    quality?: string,
    variation?: number
  ): string {
    let enhancedPrompt = basePrompt;

    // Add style specifications
    switch (style) {
      case 'artistic':
        enhancedPrompt += ', artistic style, creative interpretation, expressive brushstrokes';
        break;
      case 'cartoon':
        enhancedPrompt += ', cartoon style, animated, colorful, stylized illustration';
        break;
      case 'photographic':
        enhancedPrompt += ', photographic style, realistic photography, professional lighting';
        break;
      default: // realistic
        enhancedPrompt += ', realistic style, detailed, high-quality rendering';
        break;
    }

    // Add quality specifications
    if (quality === 'hd') {
      enhancedPrompt += ', high definition, sharp details, professional quality';
    }

    // Add slight variation for multiple images
    if (variation && variation > 0) {
      const variations = [
        ', different angle',
        ', alternative composition',
        ', varied lighting',
        ', different perspective'
      ];
      enhancedPrompt += variations[variation % variations.length];
    }

    return enhancedPrompt;
  }

  cancelCurrentRequest(): void {
    if (this.currentAbortController && !this.currentAbortController.signal.aborted) {
      this.currentAbortController.abort();
      this.isGenerating.set(false);
    }
  }

  private setError(message: string, type: ImageGenerationError['type']): void {
    this.lastError.set({
      message,
      type,
      timestamp: new Date()
    });
  }

  clearError(): void {
    this.lastError.set(null);
  }

  /**
   * Clear generated images history
   */
  clearGeneratedImages(): void {
    this.generatedImages.set([]);
  }

  /**
   * Remove a specific image from history
   */
  removeGeneratedImage(index: number): void {
    const currentImages = this.generatedImages();
    const updatedImages = currentImages.filter((_, i) => i !== index);
    this.generatedImages.set(updatedImages);
  }

  /**
   * Get image generation history
   */
  getGeneratedImages(): ImageGenerationResponse[] {
    return this.generatedImages();
  }
}