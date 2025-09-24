/**
 * ANGULAR AI AGENT PROJECT - FORM PATTERNS
 *
 * This file demonstrates the reactive form patterns used throughout this project.
 * Use these patterns as reference when creating forms with Claude Code.
 *
 * Based on analysis of:
 * - projects/ai-agent/src/app/components/text-generation/text-generation.ts
 * - Angular 20+ reactive forms best practices
 */

import {Component, inject, signal, computed} from '@angular/core';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators, FormControl, FormGroup, AbstractControl} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatButtonModule} from '@angular/material/button';
import {MatSliderModule} from '@angular/material/slider';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatRadioModule} from '@angular/material/radio';
import {MatSnackBar} from '@angular/material/snack-bar';

// ===============================================
// PATTERN 1: FORM BUILDER AND BASIC SETUP
// ===============================================

@Component({
  selector: 'app-form-example',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSliderModule,
    MatCheckboxModule,
    MatRadioModule,
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <!-- Form fields go here -->
    </form>
  `
})
export class FormExampleComponent {

  // ✅ ALWAYS use NonNullableFormBuilder
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  // ✅ Form state management with signals
  readonly loading = signal(false);
  readonly submitted = signal(false);

  // ===============================================
  // PATTERN 2: FORM GROUP DEFINITION WITH VALIDATION
  // ===============================================

  readonly form = this.fb.group({
    // ✅ Text input with required and minLength validation
    title: ['Default Value', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(100)
    ]],

    // ✅ Textarea with required validation
    description: ['', [
      Validators.required,
      Validators.minLength(10)
    ]],

    // ✅ Select dropdown with required validation
    category: ['medium', [
      Validators.required
    ]],

    // ✅ Number input with min/max validation
    priority: [1, [
      Validators.required,
      Validators.min(1),
      Validators.max(10)
    ]],

    // ✅ Email input with email validation
    email: ['', [
      Validators.required,
      Validators.email
    ]],

    // ✅ Boolean checkbox
    acceptTerms: [false, [
      Validators.requiredTrue
    ]],

    // ✅ Number slider with validation
    temperature: [0.7, [
      Validators.min(0),
      Validators.max(2.0)
    ]],

    // ✅ Array of options (checkboxes)
    selectedOptions: [[] as string[], [
      this.minimumSelectionValidator(1)
    ]],

    // ✅ Nested form group
    address: this.fb.group({
      street: ['', [Validators.required]],
      city: ['', [Validators.required]],
      zipCode: ['', [
        Validators.required,
        Validators.pattern(/^\d{5}$/)
      ]]
    }),

    // ✅ Dynamic form array (handled separately)
    tags: this.fb.array([])
  });

  // ===============================================
  // PATTERN 3: COMPUTED FORM STATE
  // ===============================================

  // ✅ Computed form validation state
  readonly isFormValid = computed(() => this.form.valid);
  readonly isFormDirty = computed(() => this.form.dirty);
  readonly isFormTouched = computed(() => this.form.touched);
  readonly canSubmit = computed(() =>
    this.isFormValid() && !this.loading()
  );

  // ✅ Individual field state computed
  readonly titleErrors = computed(() => this.getFieldErrors('title'));
  readonly emailErrors = computed(() => this.getFieldErrors('email'));

  // ===============================================
  // PATTERN 4: DROPDOWN/SELECT OPTIONS
  // ===============================================

  readonly categoryOptions = [
    { value: 'low', label: 'Low Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'high', label: 'High Priority' },
    { value: 'urgent', label: 'Urgent' }
  ];

  readonly checkboxOptions = [
    { value: 'option1', label: 'Feature A' },
    { value: 'option2', label: 'Feature B' },
    { value: 'option3', label: 'Feature C' }
  ];

  // ===============================================
  // PATTERN 5: FORM SUBMISSION WITH ERROR HANDLING
  // ===============================================

  async onSubmit(): Promise<void> {
    // ✅ Prevent submission if form is invalid
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showError('Please fix form errors before submitting.');
      return;
    }

    try {
      this.loading.set(true);
      this.submitted.set(false);

      // ✅ Get strongly-typed form values
      const formValue = this.form.getRawValue();

      // ✅ Process form submission
      await this.processFormData(formValue);

      // ✅ Success handling
      this.showSuccess('Form submitted successfully!');
      this.submitted.set(true);

      // ✅ Reset form after success (optional)
      this.resetForm();

    } catch (error: any) {
      const errorMessage = error.message || 'Form submission failed';
      this.showError(errorMessage);
      console.error('Form submission error:', error);
    } finally {
      this.loading.set(false);
    }
  }

  // ===============================================
  // PATTERN 6: FORM VALIDATION HELPERS
  // ===============================================

  // ✅ Get field validation errors
  private getFieldErrors(fieldName: string): string[] {
    const field = this.form.get(fieldName);
    const errors: string[] = [];

    if (field && field.invalid && (field.dirty || field.touched)) {
      if (field.errors?.['required']) {
        errors.push(`${this.getFieldLabel(fieldName)} is required.`);
      }
      if (field.errors?.['minlength']) {
        const minLength = field.errors['minlength'].requiredLength;
        errors.push(`${this.getFieldLabel(fieldName)} must be at least ${minLength} characters.`);
      }
      if (field.errors?.['maxlength']) {
        const maxLength = field.errors['maxlength'].requiredLength;
        errors.push(`${this.getFieldLabel(fieldName)} must be no more than ${maxLength} characters.`);
      }
      if (field.errors?.['email']) {
        errors.push('Please enter a valid email address.');
      }
      if (field.errors?.['min']) {
        const min = field.errors['min'].min;
        errors.push(`${this.getFieldLabel(fieldName)} must be at least ${min}.`);
      }
      if (field.errors?.['max']) {
        const max = field.errors['max'].max;
        errors.push(`${this.getFieldLabel(fieldName)} must be no more than ${max}.`);
      }
      if (field.errors?.['pattern']) {
        errors.push(`${this.getFieldLabel(fieldName)} format is invalid.`);
      }
    }

    return errors;
  }

  // ✅ Check if field has error
  hasFieldError(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // ✅ Check if field is valid
  isFieldValid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.valid && (field.dirty || field.touched));
  }

  // ✅ Get field value
  getFieldValue(fieldName: string): any {
    return this.form.get(fieldName)?.value;
  }

  // ===============================================
  // PATTERN 7: DYNAMIC FORM OPERATIONS
  // ===============================================

  // ✅ Update field value programmatically
  updateField(fieldName: string, value: any): void {
    this.form.patchValue({ [fieldName]: value });
  }

  // ✅ Disable/enable fields
  disableField(fieldName: string): void {
    this.form.get(fieldName)?.disable();
  }

  enableField(fieldName: string): void {
    this.form.get(fieldName)?.enable();
  }

  // ✅ Add validators dynamically
  addValidator(fieldName: string, validator: any): void {
    const field = this.form.get(fieldName);
    if (field) {
      const validators = field.validator ? [field.validator, validator] : [validator];
      field.setValidators(validators);
      field.updateValueAndValidity();
    }
  }

  // ✅ Clear field errors
  clearFieldErrors(fieldName: string): void {
    const field = this.form.get(fieldName);
    if (field) {
      field.setErrors(null);
    }
  }

  // ===============================================
  // PATTERN 8: FORM RESET AND CLEANUP
  // ===============================================

  resetForm(): void {
    // ✅ Reset to initial values with pristine state
    this.form.reset();

    // ✅ Or reset with specific values
    this.form.reset({
      title: 'Default Value',
      category: 'medium',
      priority: 1,
      temperature: 0.7,
      acceptTerms: false
    });

    // ✅ Clear submission state
    this.submitted.set(false);
  }

  // ✅ Partial form reset
  resetField(fieldName: string, defaultValue: any = ''): void {
    this.form.patchValue({ [fieldName]: defaultValue });
    this.form.get(fieldName)?.markAsUntouched();
    this.form.get(fieldName)?.markAsPristine();
  }

  // ===============================================
  // PATTERN 9: KEYBOARD SHORTCUTS
  // ===============================================

  onKeyDown(event: KeyboardEvent): void {
    // ✅ Submit on Ctrl+Enter (common pattern)
    if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault();
      this.onSubmit();
    }

    // ✅ Reset on Escape
    if (event.key === 'Escape') {
      event.preventDefault();
      this.resetForm();
    }
  }

  // ===============================================
  // PATTERN 10: CHECKBOX GROUP HANDLING
  // ===============================================

  onCheckboxChange(option: string, checked: boolean): void {
    const selectedOptions = this.getFieldValue('selectedOptions') as string[];

    if (checked) {
      // Add option if checked
      if (!selectedOptions.includes(option)) {
        this.updateField('selectedOptions', [...selectedOptions, option]);
      }
    } else {
      // Remove option if unchecked
      this.updateField('selectedOptions', selectedOptions.filter(o => o !== option));
    }
  }

  isOptionSelected(option: string): boolean {
    const selectedOptions = this.getFieldValue('selectedOptions') as string[];
    return selectedOptions.includes(option);
  }

  // ===============================================
  // PATTERN 11: CUSTOM VALIDATORS
  // ===============================================

  // ✅ Custom validator for minimum selections
  private minimumSelectionValidator(minSelections: number) {
    return (control: AbstractControl) => {
      const value = control.value as string[];
      if (!value || value.length < minSelections) {
        return { minimumSelection: { required: minSelections, actual: value?.length || 0 } };
      }
      return null;
    };
  }

  // ✅ Custom async validator example
  private uniqueValueValidator = (control: AbstractControl) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate async validation (e.g., API call)
        const isUnique = control.value !== 'duplicate';
        resolve(isUnique ? null : { notUnique: true });
      }, 500);
    });
  };

  // ===============================================
  // HELPER METHODS
  // ===============================================

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      title: 'Title',
      description: 'Description',
      category: 'Category',
      priority: 'Priority',
      email: 'Email',
      acceptTerms: 'Terms Acceptance',
      temperature: 'Temperature'
    };
    return labels[fieldName] || fieldName;
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

  private async processFormData(data: any): Promise<void> {
    // Simulate processing
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) {
          resolve();
        } else {
          reject(new Error('Processing failed'));
        }
      }, 1000);
    });
  }
}

// ===============================================
// PATTERN 12: FORM DATA INTERFACES
// ===============================================

export interface FormData {
  title: string;
  description: string;
  category: string;
  priority: number;
  email: string;
  acceptTerms: boolean;
  temperature: number;
  selectedOptions: string[];
  address: {
    street: string;
    city: string;
    zipCode: string;
  };
  tags: string[];
}

// ===============================================
// PATTERN 13: FORM VALIDATION CONFIGURATION
// ===============================================

export const VALIDATION_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PHONE: /^\+?[\d\s\-\(\)]{10,}$/,
  ZIP_CODE: /^\d{5}(-\d{4})?$/,
  STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  NUMBERS_ONLY: /^\d+$/
};

export const VALIDATION_MESSAGES = {
  required: (field: string) => `${field} is required.`,
  minLength: (field: string, min: number) => `${field} must be at least ${min} characters.`,
  maxLength: (field: string, max: number) => `${field} must be no more than ${max} characters.`,
  min: (field: string, min: number) => `${field} must be at least ${min}.`,
  max: (field: string, max: number) => `${field} must be no more than ${max}.`,
  email: () => 'Please enter a valid email address.',
  pattern: (field: string) => `${field} format is invalid.`,
  requiredTrue: (field: string) => `${field} must be accepted.`
};

/**
 * ===============================================
 * FORM PATTERN SUMMARY
 * ===============================================
 *
 * KEY CONVENTIONS TO FOLLOW:
 *
 * 1. ALWAYS use NonNullableFormBuilder
 * 2. ALWAYS provide default values for form controls
 * 3. ALWAYS include proper validation
 * 4. ALWAYS use ReactiveFormsModule (not template-driven)
 * 5. ALWAYS handle form submission with try/catch/finally
 * 6. ALWAYS mark all fields as touched on invalid submission
 * 7. ALWAYS provide user feedback via snackbar
 * 8. ALWAYS use computed signals for form state
 * 9. ALWAYS implement keyboard shortcuts (Ctrl+Enter, Escape)
 * 10. ALWAYS reset form after successful submission (when appropriate)
 *
 * VALIDATION PATTERNS:
 * - Use built-in validators when possible
 * - Create custom validators for business logic
 * - Implement async validators for server-side validation
 * - Use pattern validators for format validation
 * - Group related validations together
 *
 * ERROR HANDLING:
 * - Show field-level errors reactively
 * - Provide clear, user-friendly error messages
 * - Use computed signals for error state
 * - Handle both sync and async validation errors
 *
 * FORM STATE:
 * - Track loading, submitted, dirty, touched states
 * - Use computed signals for derived states
 * - Implement proper form reset functionality
 * - Handle dynamic form operations
 *
 * MATERIAL FORM FIELDS:
 * - Always wrap inputs in mat-form-field
 * - Use mat-error for validation messages
 * - Implement proper accessibility
 * - Use appropriate input types and attributes
 *
 * PERFORMANCE:
 * - Use OnPush change detection strategy
 * - Minimize form rebuilds
 * - Use trackBy for dynamic form arrays
 * - Implement proper cleanup in ngOnDestroy
 */