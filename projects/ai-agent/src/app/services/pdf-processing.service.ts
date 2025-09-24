import { Injectable, signal, inject, effect } from '@angular/core';
import { GoogleGenAI, createPartFromUri } from '@google/genai';
import { ApiKeyService } from './api-key.service';

export interface PdfProcessingError {
  message: string;
  type: 'API_KEY_MISSING' | 'NETWORK_ERROR' | 'RATE_LIMIT' | 'INVALID_REQUEST' | 'FILE_PROCESSING_FAILED' | 'UNKNOWN_ERROR';
  timestamp: Date;
}

export interface PdfUploadRequest {
  source: 'url' | 'file';
  url?: string;
  file?: File;
  displayName: string;
}

export interface PdfAnalysisRequest {
  pdfs: ProcessedPdf[];
  prompt: string;
}

export interface ProcessedPdf {
  name: string;
  uri: string;
  mimeType: string;
  displayName: string;
  source: 'url' | 'file';
  originalUrl?: string;
  fileName?: string;
  uploadedAt: Date;
  size?: number;
}

export interface PdfAnalysisResponse {
  result: string;
  pdfs: ProcessedPdf[];
  prompt: string;
  model: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PdfProcessingService {
  private readonly apiKeyService = inject(ApiKeyService);

  private ai?: GoogleGenAI;
  private currentAbortController?: AbortController;
  readonly isInitialized = signal(false);
  readonly lastError = signal<PdfProcessingError | null>(null);
  readonly isProcessing = signal(false);
  readonly isUploading = signal(false);
  readonly uploadProgress = signal<string>('');

  // PDF processing specific state
  readonly processedPdfs = signal<ProcessedPdf[]>([]);
  readonly analysisHistory = signal<PdfAnalysisResponse[]>([]);

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
      console.error('Failed to initialize Google Gen AI for PDF processing:', error);
      this.setError('Failed to initialize AI PDF processing service. Please check your API key.', 'API_KEY_MISSING');
    }
  }

  private resetService(): void {
    this.ai = undefined;
    this.isInitialized.set(false);
    this.isProcessing.set(false);
    this.isUploading.set(false);
    this.uploadProgress.set('');
    this.currentAbortController?.abort();
    this.currentAbortController = undefined;
    this.setError('Please provide your Google AI API key to start processing PDFs.', 'API_KEY_MISSING');
  }

  isReady(): boolean {
    return this.isInitialized() && !!this.ai && this.apiKeyService.hasApiKey();
  }

  async uploadPdf(request: PdfUploadRequest): Promise<ProcessedPdf> {
    if (!this.ai || !this.isReady()) {
      throw new Error('AI PDF processing service not ready. Please provide a valid API key.');
    }

    try {
      this.isUploading.set(true);
      this.uploadProgress.set('Preparing PDF...');
      this.lastError.set(null);

      let pdfBuffer: ArrayBuffer;
      let fileName: string;
      let fileSize: number = 0;

      if (request.source === 'url') {
        if (!request.url) {
          throw new Error('URL is required for URL-based uploads');
        }
        this.uploadProgress.set('Downloading PDF from URL...');

        const response = await fetch(request.url);
        if (!response.ok) {
          throw new Error(`Failed to download PDF: ${response.statusText}`);
        }

        pdfBuffer = await response.arrayBuffer();
        fileSize = pdfBuffer.byteLength;
        fileName = request.url.split('/').pop() || 'document.pdf';
      } else {
        if (!request.file) {
          throw new Error('File is required for file-based uploads');
        }
        this.uploadProgress.set('Reading PDF file...');
        pdfBuffer = await request.file.arrayBuffer();
        fileName = request.file.name;
        fileSize = request.file.size;
      }

      this.uploadProgress.set('Uploading PDF to AI service...');
      const fileBlob = new Blob([pdfBuffer], { type: 'application/pdf' });

      const file = await this.ai.files.upload({
        file: fileBlob,
        config: {
          displayName: request.displayName,
        },
      });

      this.uploadProgress.set('Processing PDF...');

      if (!file.name) {
        throw new Error('File upload failed - no file name received');
      }

      // Wait for the file to be processed
      let getFile = await this.ai.files.get({ name: file.name });
      while (getFile.state === 'PROCESSING') {
        this.uploadProgress.set('AI is processing PDF, please wait...');

        getFile = await this.ai.files.get({ name: file.name });
        console.log(`Current file status: ${getFile.state}`);

        await new Promise((resolve) => {
          setTimeout(resolve, 3000); // Check every 3 seconds
        });
      }

      if (getFile.state === 'FAILED') {
        throw new Error('PDF processing failed. Please try again with a different file.');
      }

      if (!file.uri || !file.mimeType) {
        throw new Error('File processing incomplete - missing file URI or MIME type');
      }

      // Mark API key as validated on successful upload
      this.apiKeyService.markAsValidated();

      const processedPdf: ProcessedPdf = {
        name: file.name,
        uri: file.uri,
        mimeType: file.mimeType,
        displayName: request.displayName,
        source: request.source,
        originalUrl: request.source === 'url' ? request.url : undefined,
        fileName: request.source === 'file' ? fileName : undefined,
        uploadedAt: new Date(),
        size: fileSize
      };

      // Add to processed PDFs
      const currentPdfs = this.processedPdfs();
      this.processedPdfs.set([processedPdf, ...currentPdfs]);

      return processedPdf;

    } catch (error: any) {
      let errorType: PdfProcessingError['type'] = 'UNKNOWN_ERROR';
      let errorMessage = 'An unexpected error occurred while uploading PDF.';

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
      } else if (error.message?.includes('processing failed') || error.message?.includes('FAILED')) {
        errorType = 'FILE_PROCESSING_FAILED';
        errorMessage = 'PDF processing failed. The file might be corrupted or unsupported.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      this.setError(errorMessage, errorType);
      throw error;
    } finally {
      this.isUploading.set(false);
      this.uploadProgress.set('');
    }
  }

  async analyzeDocuments(request: PdfAnalysisRequest): Promise<PdfAnalysisResponse> {
    if (!this.ai || !this.isReady()) {
      throw new Error('AI PDF processing service not ready. Please provide a valid API key.');
    }

    if (request.pdfs.length === 0) {
      throw new Error('At least one PDF is required for analysis.');
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

      const content: any[] = [request.prompt];

      // Add PDF parts to content
      for (const pdf of request.pdfs) {
        if (pdf.uri && pdf.mimeType) {
          const fileContent = createPartFromUri(pdf.uri, pdf.mimeType);
          content.push(fileContent);
        }
      }

      // Check if request was cancelled during preparation
      if (abortSignal.aborted) {
        throw new Error('Request was cancelled');
      }

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: content,
      });

      // Check if request was cancelled during generation
      if (abortSignal.aborted) {
        throw new Error('Request was cancelled');
      }

      if (!response?.text) {
        throw new Error('No analysis result received from the AI model.');
      }

      const analysisResponse: PdfAnalysisResponse = {
        result: response.text,
        pdfs: request.pdfs,
        prompt: request.prompt,
        model: 'gemini-2.5-flash',
        timestamp: new Date()
      };

      // Add to analysis history
      const currentHistory = this.analysisHistory();
      this.analysisHistory.set([analysisResponse, ...currentHistory]);

      return analysisResponse;

    } catch (error: any) {
      // Don't log cancellation errors
      if (error.name === 'AbortError' || error.message?.includes('cancelled')) {
        throw new Error('Request was cancelled by user');
      }

      let errorType: PdfProcessingError['type'] = 'UNKNOWN_ERROR';
      let errorMessage = 'An unexpected error occurred while analyzing documents.';

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
        errorMessage = 'Invalid request. Please check your prompt and PDFs.';
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

  cancelCurrentRequest(): void {
    if (this.currentAbortController && !this.currentAbortController.signal.aborted) {
      this.currentAbortController.abort();
      this.isProcessing.set(false);
    }
  }

  private setError(message: string, type: PdfProcessingError['type']): void {
    this.lastError.set({
      message,
      type,
      timestamp: new Date()
    });
  }

  clearError(): void {
    this.lastError.set(null);
  }

  removePdf(index: number): void {
    const currentPdfs = this.processedPdfs();
    const updatedPdfs = currentPdfs.filter((_, i) => i !== index);
    this.processedPdfs.set(updatedPdfs);
  }

  clearProcessedPdfs(): void {
    this.processedPdfs.set([]);
  }

  removeAnalysis(index: number): void {
    const currentHistory = this.analysisHistory();
    const updatedHistory = currentHistory.filter((_, i) => i !== index);
    this.analysisHistory.set(updatedHistory);
  }

  clearAnalysisHistory(): void {
    this.analysisHistory.set([]);
  }

  getProcessedPdfs(): ProcessedPdf[] {
    return this.processedPdfs();
  }

  getAnalysisHistory(): PdfAnalysisResponse[] {
    return this.analysisHistory();
  }
}