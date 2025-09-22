import { Injectable, signal, inject, effect } from '@angular/core';
import {GoogleGenAI} from '@google/genai';
import { ApiKeyService } from './api-key.service';

export interface GenerationError {
  message: string;
  type: 'API_KEY_MISSING' | 'NETWORK_ERROR' | 'RATE_LIMIT' | 'INVALID_REQUEST' | 'UNKNOWN_ERROR';
  timestamp: Date;
}

export interface GenerationRequest {
  model: string;
  prompt: string;
  temperature: number;
  maxOutputTokens: number;
}

export interface GenerationResponse {
  text: string;
  model: string;
  tokensUsed?: number;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleGenAiService {
  private readonly apiKeyService = inject(ApiKeyService);

  private ai?: GoogleGenAI;
  private currentAbortController?: AbortController;
  readonly isInitialized = signal(false);
  readonly lastError = signal<GenerationError | null>(null);
  readonly isGenerating = signal(false);

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
      console.error('Failed to initialize Google Gen AI:', error);
      this.setError('Failed to initialize AI service. Please check your API key.', 'API_KEY_MISSING');
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
    this.setError('Please provide your Google AI API key to start using the assistant.', 'API_KEY_MISSING');
  }

  /**
   * Check if the service is ready to use
   */
  isReady(): boolean {
    return this.isInitialized() && !!this.ai && this.apiKeyService.hasApiKey();
  }

  async generateContent(request: GenerationRequest): Promise<GenerationResponse> {
    if (!this.ai || !this.isReady()) {
      throw new Error('AI service not ready. Please provide a valid API key.');
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

      const response = await this.ai.models.generateContent({
        model: request.model,
        contents: request.prompt,
        config: {
          temperature: request.temperature,
          maxOutputTokens: request.maxOutputTokens,
          thinkingConfig: {
            thinkingBudget: 0,
          }
        }
      });

      // Check if request was cancelled during generation
      if (abortSignal.aborted) {
        throw new Error('Request was cancelled');
      }

      if (!response?.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('No response received from the AI model.');
      }

      // Mark API key as validated on successful generation
      this.apiKeyService.markAsValidated();

      return {
        text: response.candidates[0].content.parts[0].text,
        model: request.model,
        timestamp: new Date()
      };

    } catch (error: any) {
      // Don't log cancellation errors
      if (error.name === 'AbortError' || error.message?.includes('cancelled')) {
        throw new Error('Request was cancelled by user');
      }

      let errorType: GenerationError['type'] = 'UNKNOWN_ERROR';
      let errorMessage = 'An unexpected error occurred.';

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

  cancelCurrentRequest(): void {
    if (this.currentAbortController && !this.currentAbortController.signal.aborted) {
      this.currentAbortController.abort();
      this.isGenerating.set(false);
    }
  }

  private setError(message: string, type: GenerationError['type']): void {
    this.lastError.set({
      message,
      type,
      timestamp: new Date()
    });
  }

  clearError(): void {
    this.lastError.set(null);
  }
}
