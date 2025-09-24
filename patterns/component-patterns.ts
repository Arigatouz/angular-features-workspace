/**
 * ANGULAR AI AGENT PROJECT - COMPONENT PATTERNS
 *
 * This file demonstrates the key component patterns used throughout this project.
 * Use these patterns as reference when creating new components with Claude Code.
 *
 * Based on analysis of:
 * - projects/ai-agent/src/app/components/text-generation/text-generation.ts
 * - projects/ai-agent/src/app/components/side-nav/side-nav.component.ts
 * - projects/ai-agent/src/app/app.ts
 */

import {Component, inject, signal, computed, effect, afterRenderEffect, ViewChild, ElementRef, OnInit, AfterViewInit, Injector} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBar} from '@angular/material/snack-bar';
import {toSignal} from '@angular/core/rxjs-interop';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {map, shareReplay} from 'rxjs/operators';

// ===============================================
// PATTERN 1: STANDALONE COMPONENT ARCHITECTURE
// ===============================================

@Component({
  selector: 'app-example-component',
  standalone: true,                    // ✅ Always standalone: true
  imports: [                          // ✅ Explicit imports in component
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  providers: [],                      // ✅ Component-level providers when needed
  templateUrl: './example-component.html',
  styleUrl: './example-component.scss'  // ✅ Note: styleUrl (singular), not styleUrls
})
export class ExampleComponent implements OnInit, AfterViewInit {

  // ===============================================
  // PATTERN 2: MODERN DEPENDENCY INJECTION
  // ===============================================

  // ✅ Use inject() function instead of constructor injection
  private readonly snackBar = inject(MatSnackBar);
  private readonly breakpointObserver = inject(BreakpointObserver);
  // @ts-ignore
  readonly #injector = inject(Injector);  // ✅ For effects that need injector

  // ===============================================
  // PATTERN 3: REACTIVE STATE WITH SIGNALS
  // ===============================================

  // ✅ Basic signals for component state
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly isExpanded = signal(false);

  // ✅ Computed signals for derived state
  readonly isDisabled = computed(() => this.loading() || !!this.error());
  readonly buttonText = computed(() => this.loading() ? 'Loading...' : 'Submit');

  // ✅ Convert RxJS observables to signals
  readonly isHandset = toSignal(
    this.breakpointObserver.observe(Breakpoints.Handset).pipe(
      map(result => result.matches),
      shareReplay()
    )
  );

  // ===============================================
  // PATTERN 4: REACTIVE FORMS WITH VALIDATION
  // ===============================================

  private readonly fb = inject(NonNullableFormBuilder);

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    priority: ['medium', Validators.required],
    maxItems: [10, [Validators.min(1), Validators.max(100)]],
  });

  // ===============================================
  // PATTERN 5: VIEWCHILD AND DOM REFERENCES
  // ===============================================

  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  @ViewChild('focusTarget', { static: false }) focusTarget?: ElementRef;

  // ===============================================
  // PATTERN 6: EFFECTS AND LIFECYCLE
  // ===============================================

  constructor() {
    // ✅ Effects in constructor for reactive setup
    effect(() => {
      // React to signal changes
      if (this.error()) {
        this.showErrorMessage(this.error()!);
      }
    }, { injector: this.#injector });

    // ✅ After render effects for DOM interactions
    afterRenderEffect(() => {
      if (this.isExpanded()) {
        this.scrollToBottom();
      }
    }, { injector: this.#injector });

    // ✅ Initialization effect
    effect(() => {
      this.initializeComponent();
    }, { injector: this.#injector });
  }

  async ngOnInit() {
    // ✅ Keep ngOnInit minimal, prefer effects for reactive setup
    // Any non-reactive initialization can go here
  }

  ngAfterViewInit() {
    // ✅ DOM-related initialization after view is ready
    // Most DOM interactions handled by afterRenderEffect now
  }

  // ===============================================
  // PATTERN 7: ASYNC OPERATIONS WITH ERROR HANDLING
  // ===============================================

  async performAsyncOperation() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showErrorMessage('Please fix form errors before submitting.');
      return;
    }

    try {
      this.loading.set(true);
      this.error.set(null);

      const formValue = this.form.getRawValue();

      // Simulate async operation
      await this.simulateApiCall(formValue);

      this.showSuccessMessage('Operation completed successfully!');
      this.form.reset();

    } catch (error: any) {
      const errorMessage = error.message || 'Operation failed';
      this.error.set(errorMessage);
      this.showErrorMessage(errorMessage);
      console.error('Operation error:', error);
    } finally {
      this.loading.set(false);
    }
  }

  // ===============================================
  // PATTERN 8: USER FEEDBACK AND NOTIFICATIONS
  // ===============================================

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  // ===============================================
  // PATTERN 9: DOM MANIPULATION METHODS
  // ===============================================

  private scrollToBottom(): void {
    try {
      setTimeout(() => {
        if (this.scrollContainer?.nativeElement) {
          const container = this.scrollContainer.nativeElement;
          container.scrollTop = container.scrollHeight;
        }
      }, 100);
    } catch(err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  private focusElement(): void {
    setTimeout(() => {
      this.focusTarget?.nativeElement?.focus();
    }, 100);
  }

  // ===============================================
  // PATTERN 10: KEYBOARD EVENT HANDLING
  // ===============================================

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.performAsyncOperation();
    } else if (event.key === 'Escape') {
      this.cancel();
    }
  }

  // ===============================================
  // PATTERN 11: STATE MANAGEMENT METHODS
  // ===============================================

  toggle() {
    this.isExpanded.set(!this.isExpanded());
  }

  reset() {
    this.form.reset();
    this.error.set(null);
    this.isExpanded.set(false);
  }

  cancel() {
    this.loading.set(false);
    this.showSuccessMessage('Operation cancelled successfully.');
  }

  dismissError() {
    this.error.set(null);
  }

  // ===============================================
  // PATTERN 12: COMPUTED GETTERS FOR TEMPLATE
  // ===============================================

  get isFormValid() {
    return this.form.valid;
  }

  get hasError() {
    return !!this.error();
  }

  get canSubmit() {
    return this.isFormValid && !this.loading() && !this.hasError;
  }

  // ===============================================
  // HELPER METHODS
  // ===============================================

  private async simulateApiCall(data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate
          resolve();
        } else {
          reject(new Error('Simulated API error'));
        }
      }, 2000);
    });
  }

  private initializeComponent(): void {
    // Component initialization logic
    console.log('Component initialized');
  }
}

/**
 * ===============================================
 * COMPONENT PATTERN SUMMARY
 * ===============================================
 *
 * KEY CONVENTIONS TO FOLLOW:
 *
 * 1. ALWAYS use standalone: true
 * 2. ALWAYS use inject() for dependency injection
 * 3. ALWAYS use signals for reactive state management
 * 4. ALWAYS use NonNullableFormBuilder for forms
 * 5. ALWAYS handle async operations with try/catch/finally
 * 6. ALWAYS provide user feedback via snackbar
 * 7. ALWAYS use effects for reactive setup in constructor
 * 8. ALWAYS use afterRenderEffect for DOM interactions
 * 9. ALWAYS handle keyboard events (Enter, Escape)
 * 10. ALWAYS clean up properly with error handling
 *
 * MATERIAL IMPORTS TO COMMONLY USE:
 * - MatFormFieldModule, MatInputModule for forms
 * - MatButtonModule, MatIconModule for actions
 * - MatSnackBar for notifications
 * - MatCardModule for content containers
 * - MatProgressBarModule for loading states
 * - MatSidenavModule for navigation
 * - MatListModule for data display
 *
 * REACTIVE PATTERNS:
 * - Use signal() for mutable state
 * - Use computed() for derived state
 * - Use effect() for reactive side effects
 * - Use afterRenderEffect() for DOM manipulation
 * - Use toSignal() to convert RxJS to signals
 *
 * ERROR HANDLING:
 * - Structured error objects with proper typing
 * - User-friendly error messages
 * - Console logging for debugging
 * - Proper cleanup in finally blocks
 *
 * FORM PATTERNS:
 * - Use NonNullableFormBuilder
 * - Include proper validation
 * - Handle form state reactively
 * - Mark fields as touched for error display
 * - Reset forms after successful operations
 */
