import { Injectable, signal, inject, effect } from '@angular/core';
import {GoogleGenAI} from '@google/genai';
import { ApiKeyService } from './api-key.service';

export interface TextToSpeechError {
  message: string;
  type: 'API_KEY_MISSING' | 'NETWORK_ERROR' | 'RATE_LIMIT' | 'INVALID_REQUEST' | 'UNKNOWN_ERROR';
  timestamp: Date;
}

export interface TextToSpeechRequest {
  text: string;
  voiceName: string;
}

export interface TextToSpeechResponse {
  audioData: Uint8Array;
  text: string;
  voiceName: string;
  model: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class TextToSpeechService {
  private readonly apiKeyService = inject(ApiKeyService);

  private ai?: GoogleGenAI;
  private currentAbortController?: AbortController;
  readonly isInitialized = signal(false);
  readonly lastError = signal<TextToSpeechError | null>(null);
  readonly isGenerating = signal(false);

  // TTS specific state
  readonly generatedAudios = signal<TextToSpeechResponse[]>([]);

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
      console.error('Failed to initialize Google Gen AI for TTS:', error);
      this.setError('Failed to initialize AI TTS service. Please check your API key.', 'API_KEY_MISSING');
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
    this.setError('Please provide your Google AI API key to start generating speech.', 'API_KEY_MISSING');
  }

  /**
   * Check if the service is ready to use
   */
  isReady(): boolean {
    return this.isInitialized() && !!this.ai && this.apiKeyService.hasApiKey();
  }

  async generateSpeech(request: TextToSpeechRequest): Promise<TextToSpeechResponse> {
    if (!this.ai || !this.isReady()) {
      throw new Error('AI TTS service not ready. Please provide a valid API key.');
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
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: request.text }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: request.voiceName },
            },
          },
        }
      });

      // Check if request was cancelled during generation
      if (abortSignal.aborted) {
        throw new Error('Request was cancelled');
      }

      if (!response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
        throw new Error('No audio data received from the AI model.');
      }

      // Extract PCM data from response
      const audioBase64 = response.candidates[0].content.parts[0].inlineData.data;
      const pcmData = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));

      // Mark API key as validated on successful generation
      this.apiKeyService.markAsValidated();

      const ttsResponse: TextToSpeechResponse = {
        audioData: pcmData,
        text: request.text,
        voiceName: request.voiceName,
        model: 'gemini-2.5-flash-preview-tts',
        timestamp: new Date()
      };

      // Add to generated audios history
      const currentAudios = this.generatedAudios();
      this.generatedAudios.set([ttsResponse, ...currentAudios]);

      return ttsResponse;

    } catch (error: any) {
      // Don't log cancellation errors
      if (error.name === 'AbortError' || error.message?.includes('cancelled')) {
        throw new Error('Request was cancelled by user');
      }

      let errorType: TextToSpeechError['type'] = 'UNKNOWN_ERROR';
      let errorMessage = 'An unexpected error occurred while generating speech.';

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
   * Create and download WAV file from PCM data
   */
  async downloadWavFile(response: TextToSpeechResponse): Promise<void> {
    try {
      // Convert PCM data to WAV format in memory
      const wavBuffer = await this.createWavBuffer(
        response.audioData,
        1, // mono
        24000, // sample rate
        2 // sample width (16-bit)
      );

      // Create blob and download
      const blob = new Blob([wavBuffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `speech-${response.timestamp.toISOString().slice(0, 19).replace(/:/g, '-')}.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download WAV file:', error);
      throw new Error('Failed to create WAV file for download');
    }
  }

  /**
   * Create WAV buffer from PCM data
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

  cancelCurrentRequest(): void {
    if (this.currentAbortController && !this.currentAbortController.signal.aborted) {
      this.currentAbortController.abort();
      this.isGenerating.set(false);
    }
  }

  private setError(message: string, type: TextToSpeechError['type']): void {
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
   * Clear generated audios history
   */
  clearGeneratedAudios(): void {
    this.generatedAudios.set([]);
  }

  /**
   * Remove a specific audio from history
   */
  removeGeneratedAudio(index: number): void {
    const currentAudios = this.generatedAudios();
    const updatedAudios = currentAudios.filter((_, i) => i !== index);
    this.generatedAudios.set(updatedAudios);
  }

  /**
   * Get audio generation history
   */
  getGeneratedAudios(): TextToSpeechResponse[] {
    return this.generatedAudios();
  }
}