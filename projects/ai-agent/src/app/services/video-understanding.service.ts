import { Injectable, signal, inject, effect } from '@angular/core';
import { GoogleGenAI } from '@google/genai';
import { ApiKeyService } from './api-key.service';

export interface VideoUnderstandingError {
  message: string;
  type: 'API_KEY_MISSING' | 'NETWORK_ERROR' | 'RATE_LIMIT' | 'INVALID_REQUEST' | 'UNKNOWN_ERROR';
  timestamp: Date;
}

export interface VideoUnderstandingRequest {
  videoUrl: string;
  prompt: string;
  model?: string;
}

export interface VideoUnderstandingResponse {
  analysis: string;
  videoUrl: string;
  prompt: string;
  model: string;
  timestamp: Date;
  tokensUsed?: number;
}

@Injectable({
  providedIn: 'root'
})
export class VideoUnderstandingService {
  private readonly apiKeyService = inject(ApiKeyService);

  private ai?: GoogleGenAI;
  private currentAbortController?: AbortController;
  readonly isInitialized = signal(false);
  readonly lastError = signal<VideoUnderstandingError | null>(null);
  readonly isGenerating = signal(false);

  // Video analysis specific state
  readonly analyzedVideos = signal<VideoUnderstandingResponse[]>([]);

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
      console.error('Failed to initialize Google Gen AI for video understanding:', error);
      this.setError('Failed to initialize AI video understanding service. Please check your API key.', 'API_KEY_MISSING');
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
    this.setError('Please provide your Google AI API key to start analyzing videos.', 'API_KEY_MISSING');
  }

  /**
   * Check if the service is ready to use
   */
  isReady(): boolean {
    return this.isInitialized() && !!this.ai && this.apiKeyService.hasApiKey();
  }

  /**
   * Validate YouTube URL format
   */
  private isValidYouTubeUrl(url: string): boolean {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=|embed\/|v\/)?([a-zA-Z0-9_-]{11})(\S+)?$/;
    return youtubeRegex.test(url);
  }

  async analyzeVideo(request: VideoUnderstandingRequest): Promise<VideoUnderstandingResponse> {
    if (!this.ai || !this.isReady()) {
      throw new Error('AI video understanding service not ready. Please provide a valid API key.');
    }

    // Validate YouTube URL
    if (!this.isValidYouTubeUrl(request.videoUrl)) {
      throw new Error('Please provide a valid YouTube URL.');
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

      const model = request.model || 'gemini-2.0-flash-exp';

      const response = await this.ai.models.generateContent({
        model: model,
        contents: [
          request.prompt,
          {
            fileData: {
              fileUri: request.videoUrl,
            },
          }
        ]
      });

      // Check if request was cancelled during generation
      if (abortSignal.aborted) {
        throw new Error('Request was cancelled');
      }

      if (!response?.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('No analysis received from the AI model.');
      }

      // Mark API key as validated on successful generation
      this.apiKeyService.markAsValidated();

      const analysisResponse: VideoUnderstandingResponse = {
        analysis: response.candidates[0].content.parts[0].text,
        videoUrl: request.videoUrl,
        prompt: request.prompt,
        model: model,
        timestamp: new Date(),
        // Note: Token usage might not be available in the response format we're using
        tokensUsed: response.usageMetadata?.totalTokenCount
      };

      // Add to analyzed videos history
      const currentAnalyses = this.analyzedVideos();
      this.analyzedVideos.set([analysisResponse, ...currentAnalyses]);

      return analysisResponse;

    } catch (error: any) {
      // Don't log cancellation errors
      if (error.name === 'AbortError' || error.message?.includes('cancelled')) {
        throw new Error('Request was cancelled by user');
      }

      let errorType: VideoUnderstandingError['type'] = 'UNKNOWN_ERROR';
      let errorMessage = 'An unexpected error occurred while analyzing the video.';

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
        errorMessage = 'Invalid request. Please check your video URL and prompt.';
      } else if (error.message?.includes('YouTube URL')) {
        errorType = 'INVALID_REQUEST';
        errorMessage = error.message;
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
   * Get video title from YouTube URL (basic extraction from URL)
   */
  getVideoId(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }

  /**
   * Generate YouTube thumbnail URL
   */
  getThumbnailUrl(videoUrl: string): string | null {
    const videoId = this.getVideoId(videoUrl);
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
  }

  cancelCurrentRequest(): void {
    if (this.currentAbortController && !this.currentAbortController.signal.aborted) {
      this.currentAbortController.abort();
      this.isGenerating.set(false);
    }
  }

  private setError(message: string, type: VideoUnderstandingError['type']): void {
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
   * Clear analyzed videos history
   */
  clearAnalyzedVideos(): void {
    this.analyzedVideos.set([]);
  }

  /**
   * Remove a specific video analysis from history
   */
  removeAnalyzedVideo(index: number): void {
    const currentAnalyses = this.analyzedVideos();
    const updatedAnalyses = currentAnalyses.filter((_, i) => i !== index);
    this.analyzedVideos.set(updatedAnalyses);
  }

  /**
   * Get video analysis history
   */
  getAnalyzedVideos(): VideoUnderstandingResponse[] {
    return this.analyzedVideos();
  }
}