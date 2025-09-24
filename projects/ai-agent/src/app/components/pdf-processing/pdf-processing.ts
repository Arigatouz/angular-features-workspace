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
import {MatTabsModule} from '@angular/material/tabs';
import {MatExpansionModule} from '@angular/material/expansion';
import {TextFieldModule} from '@angular/cdk/text-field';
import {MatChipsModule} from '@angular/material/chips';
import {PdfProcessingService, PdfProcessingError, ProcessedPdf, PdfAnalysisResponse, PdfUploadRequest} from '../../services/pdf-processing.service';
import {ApiKeyService} from '../../services/api-key.service';
import {ApiKeyModalComponent} from '../api-key-modal/api-key-modal.component';

@Component({
  selector: 'app-pdf-processing',
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
    MatTabsModule,
    MatExpansionModule,
    TextFieldModule,
    MatChipsModule,
  ],
  providers: [PdfProcessingService],
  templateUrl: './pdf-processing.html',
  styleUrl: './pdf-processing.scss'
})
export class PdfProcessingComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('historyContainer') historyContainer!: ElementRef;
  @ViewChild('resultsContainer') resultsContainer!: ElementRef;

  readonly pdfProcessingService = inject(PdfProcessingService);
  readonly apiKeyService = inject(ApiKeyService);
  readonly dialog = inject(MatDialog);
  readonly snackBar = inject(MatSnackBar);

  readonly promptSuggestions = [
    'What are the main findings in these documents?',
    'Compare and contrast the key arguments in these papers.',
    'Summarize the methodology used in each document.',
    'Extract the key statistics and data points from these PDFs.',
    'What are the conclusions reached in these documents?',
    'Create a table comparing the main benchmarks between these papers.',
    'List the references and citations from these documents.'
  ];

  fb = inject(NonNullableFormBuilder);

  // Upload form
  uploadForm = this.fb.group({
    uploadType: ['url', Validators.required],
    url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+\.pdf$/i)]],
    displayName: ['', [Validators.required, Validators.minLength(2)]],
  });

  // Analysis form
  analysisForm = this.fb.group({
    prompt: ['', [Validators.required, Validators.minLength(10)]],
  });

  protected loading = signal(false);
  protected error = signal<PdfProcessingError | null>(null);
  protected selectedFiles = signal<File[]>([]);
  protected isDragging = signal(false);

  // Service state exposure
  readonly serviceError = this.pdfProcessingService.lastError;
  readonly isServiceInitialized = this.pdfProcessingService.isInitialized;
  readonly isUploading = this.pdfProcessingService.isUploading;
  readonly isProcessing = this.pdfProcessingService.isProcessing;
  readonly uploadProgress = this.pdfProcessingService.uploadProgress;
  readonly processedPdfs = this.pdfProcessingService.processedPdfs;
  readonly analysisHistory = this.pdfProcessingService.analysisHistory;

  // Computed properties for UI
  readonly totalProcessedPdfs = computed(() => this.processedPdfs().length);
  readonly totalAnalyses = computed(() => this.analysisHistory().length);
  readonly canAnalyze = computed(() =>
    this.processedPdfs().length > 0 &&
    this.analysisForm.valid &&
    this.isServiceInitialized() &&
    !this.isProcessing()
  );
  pew= effect(()=>console.log(this.canAnalyze()))
  // Track form changes for reactivity
  private uploadTypeSignal = signal('url');

  readonly isUploadTypeUrl = computed(() => this.uploadTypeSignal() === 'url');

  constructor() {
    // Check for API key and show modal if needed
    effect(() => {
      setTimeout(() => {
        if (!this.apiKeyService.hasApiKey()) {
          this.showApiKeyModal();
        }
      }, 100);
    });

    // Auto-scroll effect when analysis history changes
    afterRenderEffect(() => {
      if (this.analysisHistory().length > 0) {
        this.scrollToBottom('history');
      }
    });

    // Subscribe to form changes for reactivity
    this.uploadForm.get('uploadType')?.valueChanges.subscribe(value => {
      this.uploadTypeSignal.set(value || 'url');
    });

    // Update URL validation based on upload type
    effect(() => {
      const uploadType = this.uploadTypeSignal();
      const urlControl = this.uploadForm.get('url');

      if (uploadType === 'url') {
        urlControl?.setValidators([Validators.required, Validators.pattern(/^https?:\/\/.+\.pdf$/i)]);
      } else {
        urlControl?.clearValidators();
        urlControl?.setValue('');
      }
      urlControl?.updateValueAndValidity();
    });
  }

  private scrollToBottom(container: 'history' | 'results'): void {
    try {
      setTimeout(() => {
        const element = container === 'history' ?
          this.historyContainer?.nativeElement :
          this.resultsContainer?.nativeElement;

        if (element) {
          element.scrollTop = element.scrollHeight;
        }
      }, 100);
    } catch(err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  // File handling methods
  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const filteredFiles = Array.from(input.files).filter(file =>
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      );

      if (filteredFiles.length === 0) {
        this.showError('Please select valid PDF files only.');
        return;
      }

      this.selectedFiles.set(filteredFiles);

      if (filteredFiles.length > 0) {
        this.uploadForm.patchValue({
          displayName: filteredFiles[0].name.replace('.pdf', '')
        });
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
    if (files) {
      const filteredFiles = Array.from(files).filter(file =>
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      );

      if (filteredFiles.length === 0) {
        this.showError('Please drop valid PDF files only.');
        return;
      }

      this.selectedFiles.set(filteredFiles);

      if (filteredFiles.length > 0) {
        this.uploadForm.patchValue({
          displayName: filteredFiles[0].name.replace('.pdf', ''),
          uploadType: 'file'
        });
      }
    }
  }

  clearSelectedFiles(): void {
    this.selectedFiles.set([]);
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  // Upload methods
  async uploadPdf(): Promise<void> {
    if (this.uploadForm.invalid) {
      this.uploadForm.markAllAsTouched();
      this.showError('Please fix form errors before uploading.');
      return;
    }

    if (!this.isServiceInitialized()) {
      this.showError('PDF processing service is not initialized. Please check your API key configuration.');
      return;
    }

    const uploadType = this.uploadForm.get('uploadType')?.value;
    const displayName = this.uploadForm.get('displayName')?.value || 'Untitled Document';

    try {
      this.loading.set(true);
      this.error.set(null);
      this.pdfProcessingService.clearError();

      if (uploadType === 'url') {
        const url = this.uploadForm.get('url')?.value;
        if (!url) {
          throw new Error('URL is required');
        }

        const request: PdfUploadRequest = {
          source: 'url',
          url: url,
          displayName: displayName
        };

        await this.pdfProcessingService.uploadPdf(request);
        this.showSuccess('PDF uploaded successfully from URL!');

        // Clear form
        this.uploadForm.patchValue({
          url: '',
          displayName: ''
        });

      } else {
        const files = this.selectedFiles();
        if (files.length === 0) {
          throw new Error('Please select at least one PDF file');
        }

        // Upload all selected files
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const fileDisplayName = i === 0 ? displayName : `${displayName} (${i + 1})`;

          const request: PdfUploadRequest = {
            source: 'file',
            file: file,
            displayName: fileDisplayName
          };

          await this.pdfProcessingService.uploadPdf(request);
        }

        this.showSuccess(`${files.length} PDF(s) uploaded successfully!`);

        // Clear form and files
        this.clearSelectedFiles();
        this.uploadForm.patchValue({ displayName: '' });
      }

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to upload PDF';
      this.error.set({
        message: errorMessage,
        type: 'UNKNOWN_ERROR',
        timestamp: new Date()
      });
      this.showError(errorMessage);
      console.error('PDF upload error:', error);
    } finally {
      this.loading.set(false);
    }
  }

  // Analysis methods
  async analyzeDocuments(): Promise<void> {
    if (this.analysisForm.invalid) {
      this.analysisForm.markAllAsTouched();
      this.showError('Please enter a valid analysis prompt.');
      return;
    }

    if (this.processedPdfs().length === 0) {
      this.showError('Please upload at least one PDF before analyzing.');
      return;
    }

    const prompt = this.analysisForm.get('prompt')?.value || '';

    try {
      this.loading.set(true);
      this.error.set(null);
      this.pdfProcessingService.clearError();

      const response = await this.pdfProcessingService.analyzeDocuments({
        pdfs: this.processedPdfs(),
        prompt: prompt
      });

      this.showSuccess('Document analysis completed successfully!');

      // Clear the prompt after successful analysis
      this.analysisForm.patchValue({ prompt: '' });

      // Scroll to show new analysis
      this.scrollToBottom('history');

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to analyze documents';
      this.error.set({
        message: errorMessage,
        type: 'UNKNOWN_ERROR',
        timestamp: new Date()
      });
      this.showError(errorMessage);
      console.error('Document analysis error:', error);
    } finally {
      this.loading.set(false);
    }
  }

  // Utility methods
  useSuggestion(suggestion: string): void {
    const promptControl = this.analysisForm.get('prompt');
    promptControl?.setValue(suggestion);
    promptControl?.markAsTouched();
    promptControl?.updateValueAndValidity();
  }

  copyResult(result: string): void {
    if (!result) {
      this.showError('No result to copy');
      return;
    }

    navigator.clipboard?.writeText(result)
      .then(() => this.showSuccess('Analysis result copied to clipboard!'))
      .catch(() => this.showError('Failed to copy result to clipboard'));
  }

  downloadResult(analysis: PdfAnalysisResponse): void {
    const content = `# Analysis Results

**Prompt:** ${analysis.prompt}

**Analyzed Documents:**
${analysis.pdfs.map(pdf => `- ${pdf.displayName} (${pdf.source})`).join('\n')}

**Generated on:** ${analysis.timestamp.toLocaleDateString()} at ${analysis.timestamp.toLocaleTimeString()}

**Model:** ${analysis.model}

---

## Results

${analysis.result}
`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pdf-analysis-${analysis.timestamp.toISOString().slice(0, 19).replace(/:/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  removePdf(index: number): void {
    if (confirm('Remove this PDF from the processed list?')) {
      this.pdfProcessingService.removePdf(index);
      this.showSuccess('PDF removed from list');
    }
  }

  removeAnalysis(index: number): void {
    if (confirm('Remove this analysis from history?')) {
      this.pdfProcessingService.removeAnalysis(index);
      this.showSuccess('Analysis removed from history');
    }
  }

  clearAllPdfs(): void {
    if (confirm('Are you sure you want to clear all processed PDFs? This action cannot be undone.')) {
      this.pdfProcessingService.clearProcessedPdfs();
      this.showSuccess('All PDFs cleared');
    }
  }

  clearAnalysisHistory(): void {
    if (confirm('Are you sure you want to clear all analysis history? This action cannot be undone.')) {
      this.pdfProcessingService.clearAnalysisHistory();
      this.showSuccess('Analysis history cleared');
    }
  }

  stop(): void {
    this.pdfProcessingService.cancelCurrentRequest();
    this.loading.set(false);
    this.showSuccess('Processing stopped successfully.');
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
    if (this.canAnalyze() && !this.loading()) {
      this.analyzeDocuments();
    }
  }

  dismissError(): void {
    this.error.set(null);
    this.pdfProcessingService.clearError();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && event.ctrlKey && !event.shiftKey) {
      event.preventDefault();
      this.analyzeDocuments();
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
        this.showSuccess('API key set successfully! You can now process PDFs.');
      } else if (!this.apiKeyService.hasApiKey()) {
        this.showError('API key is required to use PDF processing.');
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

  getFileSize(bytes?: number): string {
    if (!bytes) return 'Unknown';

    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}
