import {Component, inject, Injector, resource, signal, ViewChild, ElementRef, AfterViewInit, OnInit, effect, afterRenderEffect, computed} from '@angular/core';
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
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatListModule} from '@angular/material/list';
import {MatMenuModule} from '@angular/material/menu';
import {MatDialogModule, MatDialog} from '@angular/material/dialog';
import {MatBadgeModule} from '@angular/material/badge';
import {TextFieldModule} from '@angular/cdk/text-field';
import {GoogleGenAiService, GenerationError} from '../../services/google-gen-ai';
import {ConversationService} from '../../services/conversation.service';
import {ApiKeyService} from '../../services/api-key.service';
import {ApiKeyModalComponent} from '../api-key-modal/api-key-modal.component';
import {MarkdownPipe} from '../../pipes/markdown.pipe';

@Component({
  selector: 'app-text-generation',
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
    MatSidenavModule,
    MatListModule,
    MatMenuModule,
    MatDialogModule,
    MatBadgeModule,
    TextFieldModule,
    MarkdownPipe,
  ],
  providers: [GoogleGenAiService],
  templateUrl: './text-generation.html',
  styleUrl: './text-generation.scss'
})
export class TextGeneration implements AfterViewInit, OnInit {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  DEFAULT_TEXT = 'Write a 4 line poem about the sea.';
  readonly googleGenAiService = inject(GoogleGenAiService);
  readonly conversationService = inject(ConversationService);
  readonly apiKeyService = inject(ApiKeyService);
  readonly dialog = inject(MatDialog);
  readonly snackBar = inject(MatSnackBar);
  readonly models = [
    {id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash'},
    {id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash'},
  ];

  fb = inject(NonNullableFormBuilder)
  form = this.fb.group({
    prompt: [this.DEFAULT_TEXT, [Validators.required, Validators.minLength(2)]],
    model: [this.models[0].id, Validators.required],
    temperature: [0.7],
    maxOutputTokens: [512, [Validators.min(1), Validators.max(8192)]],
  });

  protected loading = signal(false);
  protected error = signal<GenerationError | null>(null);
  protected sidenavOpen = signal(false);
  protected editingMessage = signal<{id: number, content: string} | null>(null);
  protected renamingConversation = signal<{uuid: string, title: string} | null>(null);

  // Conversation-related computed signals
  readonly activeConversation = this.conversationService.activeConversation;
  readonly messages = this.conversationService.activeMessages;
  readonly allConversations = this.conversationService.allConversations;

  // Database statistics computed signals
  readonly databaseStats = computed(async () => {
    return await this.conversationService.getDatabaseStats();
  });

  readonly conversationCount = computed(() => this.allConversations().length);
  readonly totalMessages = computed(() =>
    this.allConversations().reduce((total, conv) => total + conv.messages.length, 0)
  );

  // Expose service error state to template
  readonly serviceError = this.googleGenAiService.lastError;
  readonly isServiceInitialized = this.googleGenAiService.isInitialized;
  readonly isServiceGenerating = this.googleGenAiService.isGenerating;

  readonly #injector = inject(Injector)

  constructor() {
    // Initialize migration with effect for reactive setup
    effect(() => {
      this.initializeMigration();
    }, { injector: this.#injector });

    // Auto-scroll effect when messages change
    afterRenderEffect(() => {
      if (this.messages().length > 0) {
        this.scrollToBottom();
      }
    }, { injector: this.#injector });

    // Check for API key and show modal if needed
    effect(() => {
      // Wait a tick for services to initialize
      setTimeout(() => {
        if (!this.apiKeyService.hasApiKey()) {
          this.showApiKeyModal();
        }
      }, 100);
    }, { injector: this.#injector });
  }

  private async initializeMigration() {
    try {
      await this.conversationService.migrateFromLocalStorage();
    } catch (error) {
      console.error('Migration failed:', error);
    }
  }

  async ngOnInit() {
    // Keep ngOnInit for compatibility but move logic to effects
  }

  ngAfterViewInit() {
    // Auto-scroll is now handled by afterRenderEffect
  }

  private scrollToBottom(): void {
    try {
      setTimeout(() => {
        const container = this.messagesContainer.nativeElement;
        container.scrollTop = container.scrollHeight;
      }, 100);
    } catch(err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  async generate() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showError('Please fix form errors before submitting.');
      return;
    }

    if (!this.isServiceInitialized()) {
      this.showError('AI service is not initialized. Please check your API key configuration.');
      return;
    }

    const {prompt, model, temperature, maxOutputTokens} = this.form.getRawValue();

    try {
      this.loading.set(true);
      this.error.set(null);
      this.googleGenAiService.clearError();

      // Create a new conversation if none exists
      if (!this.activeConversation()) {
        await this.conversationService.createConversation();
      }

      // Add user message to conversation
      await this.conversationService.addMessage(prompt, 'user');

      // Scroll to show new user message
      this.scrollToBottom();

      const response = await this.googleGenAiService.generateContent({
        model: model || 'gemini-2.0-flash',
        prompt: prompt,
        temperature: temperature || 0.7,
        maxOutputTokens: maxOutputTokens || 512
      });

      // Add assistant response to conversation
      await this.conversationService.addMessage(response.text, 'assistant', {
        temperature,
        maxTokens: maxOutputTokens,
        tokensUsed: response.tokensUsed
      });

      this.showSuccess('Response generated successfully!');

      // Clear the input after successful generation
      this.form.patchValue({ prompt: '' });

      // Scroll to show new messages
      this.scrollToBottom();

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to generate response';
      this.error.set({
        message: errorMessage,
        type: 'UNKNOWN_ERROR',
        timestamp: new Date()
      });
      this.showError(errorMessage);
      console.error('Generation error:', error);
    } finally {
      this.loading.set(false);
    }
  }

  clear() {
    this.form.patchValue({prompt: ''});
  }

  async newConversation() {
    try {
      await this.conversationService.createConversation();
      this.form.patchValue({prompt: this.DEFAULT_TEXT});
      this.showSuccess('New conversation started!');
    } catch (error) {
      this.showError('Failed to create new conversation');
      console.error('Failed to create conversation:', error);
    }
  }

  stop() {
    this.googleGenAiService.cancelCurrentRequest();
    this.loading.set(false);
    this.showSuccess('Generation stopped successfully.');
  }

  copyMessage(content: string) {
    if (!content) {
      this.showError('No content to copy');
      return;
    }

    navigator.clipboard?.writeText(content)
      .then(() => this.showSuccess('Message copied to clipboard!'))
      .catch(() => this.showError('Failed to copy message to clipboard'));
  }

  copyConversation() {
    const conversation = this.activeConversation();
    if (!conversation) {
      this.showError('No conversation to copy');
      return;
    }

    const text = conversation.messages
      .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n');

    navigator.clipboard?.writeText(text)
      .then(() => this.showSuccess('Conversation copied to clipboard!'))
      .catch(() => this.showError('Failed to copy conversation to clipboard'));
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
      this.generate();
    }
  }

  dismissError() {
    this.error.set(null);
    this.googleGenAiService.clearError();
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.generate();
    }
  }

  // Conversation Management Methods
  toggleSidebar() {
    this.sidenavOpen.set(!this.sidenavOpen());
  }

  async selectConversation(uuid: string) {
    try {
      await this.conversationService.selectConversation(uuid);
      this.sidenavOpen.set(false);
    } catch (error) {
      this.showError('Failed to select conversation');
      console.error('Failed to select conversation:', error);
    }
  }

  startRenameConversation(conversation: any) {
    this.renamingConversation.set({
      uuid: conversation.uuid,
      title: conversation.title
    });
  }

  async saveConversationTitle(uuid: string, newTitle: string) {
    try {
      await this.conversationService.renameConversation(uuid, newTitle);
      this.renamingConversation.set(null);
      this.showSuccess('Conversation renamed successfully');
    } catch (error) {
      this.showError('Failed to rename conversation');
      console.error('Failed to rename conversation:', error);
    }
  }

  cancelRename() {
    this.renamingConversation.set(null);
  }

  async deleteConversation(uuid: string) {
    if (confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      try {
        await this.conversationService.deleteConversation(uuid);
        this.showSuccess('Conversation deleted successfully');
      } catch (error) {
        this.showError('Failed to delete conversation');
        console.error('Failed to delete conversation:', error);
      }
    }
  }

  async clearAllConversations() {
    if (confirm('Are you sure you want to delete ALL conversations? This action cannot be undone.')) {
      try {
        await this.conversationService.clearAllConversations();
        this.showSuccess('All conversations cleared');
      } catch (error) {
        this.showError('Failed to clear conversations');
        console.error('Failed to clear conversations:', error);
      }
    }
  }

  // Message Management Methods
  startEditMessage(message: any) {
    this.editingMessage.set({
      id: message.id!,
      content: message.content
    });
  }

  async saveMessageEdit(messageId: number, newContent: string) {
    try {
      await this.conversationService.updateLastMessage(newContent); // Using available method
      this.editingMessage.set(null);
      this.showSuccess('Message updated successfully');
    } catch (error) {
      this.showError('Failed to update message');
      console.error('Failed to update message:', error);
    }
  }

  cancelMessageEdit() {
    this.editingMessage.set(null);
  }

  // Export/Import Methods
  async exportCurrentConversation() {
    const conversation = this.activeConversation();
    if (!conversation) {
      this.showError('No conversation to export');
      return;
    }

    try {
      const exportData = await this.conversationService.exportConversation(conversation.uuid);
      if (exportData) {
        const blob = new Blob([exportData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversation-${conversation.title}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showSuccess('Conversation exported successfully');
      }
    } catch (error) {
      this.showError('Failed to export conversation');
      console.error('Export failed:', error);
    }
  }

  async exportAllConversations() {
    try {
      const exportData = await this.conversationService.exportAllConversations();
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all-conversations-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.showSuccess('All conversations exported successfully');
    } catch (error) {
      this.showError('Failed to export conversations');
      console.error('Export failed:', error);
    }
  }

  async onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const success = await this.conversationService.importConversations(text);
      if (success) {
        this.showSuccess('Conversations imported successfully');
      } else {
        this.showError('Failed to import conversations - invalid format');
      }
    } catch (error) {
      this.showError('Failed to import conversations');
      console.error('Import failed:', error);
    }
  }

  // API Key Management Methods
  showApiKeyModal() {
    const dialogRef = this.dialog.open(ApiKeyModalComponent, {
      width: '550px',
      height: '600px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      disableClose: !this.apiKeyService.hasApiKey(), // Can't close if no API key exists
      panelClass: 'api-key-modal-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.valid && result?.apiKey) {
        // Set the validated API key
        this.apiKeyService.setApiKey(result.apiKey, true);
        this.showSuccess('API key set successfully! You can now use the AI assistant.');
      } else if (!this.apiKeyService.hasApiKey()) {
        // If user cancelled and no API key exists, show error
        this.showError('API key is required to use the AI assistant.');
        // Show modal again after a delay
        setTimeout(() => this.showApiKeyModal(), 2000);
      }
    });
  }

  changeApiKey() {
    this.showApiKeyModal();
  }

  clearApiKey() {
    if (confirm('Are you sure you want to clear your API key? You will need to enter it again to use the assistant.')) {
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
}
