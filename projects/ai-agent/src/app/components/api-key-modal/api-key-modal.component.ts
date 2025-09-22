import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GoogleGenAI } from '@google/genai';

@Component({
  selector: 'app-api-key-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="api-key-modal">
      <h2 mat-dialog-title>
        <mat-icon>vpn_key</mat-icon>
        Enter Google AI API Key
      </h2>

      <mat-dialog-content>
        <div class="modal-content">
          <p class="description">
            To use this AI Assistant, please provide your Google AI API key.
            Your key is stored locally and never sent to our servers.
          </p>

          <div class="info-card">
            <mat-icon>info</mat-icon>
            <div>
              <strong>How to get your API key:</strong>
              <ol>
                <li>Visit <a href="https://makersuite.google.com/app/apikey" target="_blank">Google AI Studio</a></li>
                <li>Click "Create API Key"</li>
                <li>Copy and paste the key below</li>
              </ol>
            </div>
          </div>

          <form [formGroup]="form" (ngSubmit)="validateAndSave()">
            <mat-form-field appearance="outline" class="api-key-input">
              <mat-label>Google AI API Key</mat-label>
              <input matInput
                     type="password"
                     placeholder="AIzaSy..."
                     formControlName="apiKey"
                     [disabled]="validating()">
              <mat-icon matSuffix>vpn_key</mat-icon>

              @if (form.controls.apiKey.invalid && form.controls.apiKey.touched) {
                <mat-error>
                  @if (form.controls.apiKey.errors?.['required']) {
                    API Key is required
                  }
                  @if (form.controls.apiKey.errors?.['minlength']) {
                    API Key must be at least 30 characters
                  }
                  @if (form.controls.apiKey.errors?.['pattern']) {
                    Invalid API Key format (should start with 'AIzaSy')
                  }
                </mat-error>
              }
            </mat-form-field>

            @if (validationError()) {
              <div class="error-message">
                <mat-icon color="warn">error</mat-icon>
                <span>{{ validationError() }}</span>
              </div>
            }

            @if (validationSuccess()) {
              <div class="success-message">
                <mat-icon color="primary">check_circle</mat-icon>
                <span>API Key validated successfully!</span>
              </div>
            }
          </form>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="close()" [disabled]="validating()">
          Cancel
        </button>
        <button mat-raised-button
                color="primary"
                (click)="validateAndSave()"
                [disabled]="form.invalid || validating()">
          @if (validating()) {
            <mat-spinner diameter="20" class="inline-spinner"></mat-spinner>
            Validating...
          } @else {
            <ng-container>
              <mat-icon>check</mat-icon>
              Validate & Save
            </ng-container>
          }
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .api-key-modal {
      width: 500px;
      h2 {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0;
        color: #333;

        mat-icon {
          color: #667eea;
        }
      }
    }

    .modal-content {
      padding: 16px 0;
      min-height: 400px;

      .description {
        color: #666;
        margin-bottom: 32px;
        line-height: 1.6;
        font-size: 15px;
      }

      .info-card {
        display: flex;
        gap: 16px;
        padding: 20px;
        background: #f0f7ff;
        border: 1px solid #e3f2fd;
        border-radius: 8px;
        margin-bottom: 32px;

        mat-icon {
          color: #2196f3;
          margin-top: 2px;
        }

        strong {
          color: #1976d2;
          display: block;
          margin-bottom: 8px;
        }

        ol {
          margin: 0;
          padding-left: 16px;
          color: #555;

          li {
            margin: 4px 0;
          }
        }

        a {
          color: #1976d2;
          text-decoration: none;

          &:hover {
            text-decoration: underline;
          }
        }
      }

      .api-key-input {
        width: 100%;
        margin-bottom: 24px;

        .mat-mdc-form-field {
          font-size: 16px;
        }
      }

      .error-message {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #d32f2f;
        background: #ffebee;
        padding: 12px;
        border-radius: 4px;
        margin: 8px 0;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }

      .success-message {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #2e7d32;
        background: #e8f5e8;
        padding: 12px;
        border-radius: 4px;
        margin: 8px 0;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }
    }

    .inline-spinner {
      margin-right: 8px;
    }

    mat-dialog-actions {
      padding: 16px 0 0 0;

      button {
        margin-left: 8px;
      }
    }
  `]
})
export class ApiKeyModalComponent {
  private readonly dialogRef = inject(MatDialogRef<ApiKeyModalComponent>);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly validating = signal(false);
  protected readonly validationError = signal<string | null>(null);
  protected readonly validationSuccess = signal(false);

  protected readonly form = this.formBuilder.group({
    apiKey: ['', [
      Validators.required,
      Validators.minLength(30),
      Validators.pattern(/^AIzaSy[a-zA-Z0-9_-]{33,}$/)
    ]]
  });

  async validateAndSave() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const apiKey = this.form.value.apiKey!;
    this.validating.set(true);
    this.validationError.set(null);
    this.validationSuccess.set(false);

    try {
      // Test the API key with a simple request
      const genAI = new GoogleGenAI({ apiKey });

      // Make a simple test request to validate the key
      const response = await genAI.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: 'Test',
        config: {
          temperature: 0.1,
          maxOutputTokens: 10
        }
      });

      if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
        // API key is valid
        this.validationSuccess.set(true);
        this.snackBar.open('API Key validated successfully!', 'Close', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });

        // Close modal and return the valid API key
        setTimeout(() => {
          this.dialogRef.close({ apiKey, valid: true });
        }, 1000);
      } else {
        throw new Error('Invalid response from API');
      }
    } catch (error: any) {
      console.error('API Key validation failed:', error);

      let errorMessage = 'Invalid API Key. Please check and try again.';

      if (error.message?.includes('API_KEY_INVALID')) {
        errorMessage = 'The provided API key is invalid.';
      } else if (error.message?.includes('QUOTA_EXCEEDED')) {
        errorMessage = 'API quota exceeded. Please check your usage limits.';
      } else if (error.message?.includes('PERMISSION_DENIED')) {
        errorMessage = 'Permission denied. Please ensure your API key has the necessary permissions.';
      } else if (error.message?.includes('BILLING_NOT_ACTIVE')) {
        errorMessage = 'Billing is not active for this API key. Please enable billing in Google Cloud Console.';
      }

      this.validationError.set(errorMessage);
    } finally {
      this.validating.set(false);
    }
  }

  close() {
    this.dialogRef.close({ apiKey: null, valid: false });
  }
}
