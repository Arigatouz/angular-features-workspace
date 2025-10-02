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

@Component({
  selector: 'app-maps-api-key-modal',
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
        <mat-icon>map</mat-icon>
        Enter Google Maps API Key
      </h2>

      <mat-dialog-content>
        <div class="modal-content">
          <p class="description">
            To view points of interest on an interactive map, please provide your Google Maps API key.
            Your key is stored locally and never sent to our servers.
          </p>

          <div class="info-card">
            <mat-icon>info</mat-icon>
            <div>
              <strong>How to get your API key:</strong>
              <ol>
                <li>Visit <a href="https://console.cloud.google.com/google/maps-apis" target="_blank">Google Cloud Console</a></li>
                <li>Create a project or select an existing one</li>
                <li>Enable "Maps JavaScript API"</li>
                <li>Go to "Credentials" and click "Create Credentials" → "API Key"</li>
                <li>Copy and paste the key below</li>
              </ol>
              <p class="note">
                <strong>Note:</strong> Google Maps offers a $200 monthly credit. Most users stay within the free tier.
              </p>
            </div>
          </div>

          <form [formGroup]="form" (ngSubmit)="validateAndSave()">
            <mat-form-field appearance="outline" class="api-key-input">
              <mat-label>Google Maps API Key</mat-label>
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
      width: 550px;
      max-width: 95vw;

      h2 {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0;
        color: #333;

        mat-icon {
          color: #4285F4;
        }
      }
    }

    .modal-content {
      padding: 16px 0;
      min-height: 400px;

      .description {
        color: #666;
        margin-bottom: 24px;
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
          margin: 0 0 12px 0;
          padding-left: 16px;
          color: #555;

          li {
            margin: 4px 0;
          }
        }

        .note {
          margin: 12px 0 0 0;
          padding: 8px 12px;
          background: #fff8e1;
          border-left: 3px solid #ffc107;
          border-radius: 4px;
          font-size: 13px;
          color: #666;

          strong {
            color: #f57c00;
            display: inline;
            margin: 0;
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
export class MapsApiKeyModalComponent {
  private readonly dialogRef = inject(MatDialogRef<MapsApiKeyModalComponent>);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly validating = signal(false);
  protected readonly validationError = signal<string | null>(null);
  protected readonly validationSuccess = signal(false);

  protected readonly form = this.formBuilder.group({
    apiKey: ['', [
      Validators.required,
      Validators.minLength(30)
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
      // Test the API key by attempting to load the Google Maps API
      await this.testGoogleMapsApiKey(apiKey);

      // API key is valid
      this.validationSuccess.set(true);
      this.snackBar.open('Google Maps API Key validated successfully!', 'Close', {
        duration: 3000,
        panelClass: 'success-snackbar'
      });

      // Close modal and return the valid API key
      setTimeout(() => {
        this.dialogRef.close({ apiKey, valid: true });
      }, 1000);
    } catch (error: any) {
      console.error('Google Maps API Key validation failed:', error);

      let errorMessage = 'Invalid API Key. Please check and try again.';

      if (error.message?.includes('RefererNotAllowedMapError')) {
        errorMessage = 'This API key has restrictions. Please allow this domain or remove restrictions.';
      } else if (error.message?.includes('ApiNotActivatedMapError')) {
        errorMessage = 'Maps JavaScript API is not enabled. Please enable it in Google Cloud Console.';
      } else if (error.message?.includes('RequestDenied')) {
        errorMessage = 'Request denied. Please check your API key permissions.';
      }

      this.validationError.set(errorMessage);
    } finally {
      this.validating.set(false);
    }
  }

  private testGoogleMapsApiKey(apiKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Create a test script to validate the API key
      const script = document.createElement('script');
      const callbackName = 'googleMapsApiKeyTest_' + Date.now();

      // Set up success callback
      (window as any)[callbackName] = () => {
        delete (window as any)[callbackName];
        script.remove();
        resolve();
      };

      // Set up error handler
      script.onerror = () => {
        delete (window as any)[callbackName];
        script.remove();
        reject(new Error('Failed to load Google Maps API'));
      };

      // Load the API with the test key
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}`;
      script.async = true;
      script.defer = true;

      document.head.appendChild(script);

      // Timeout after 10 seconds
      setTimeout(() => {
        if ((window as any)[callbackName]) {
          delete (window as any)[callbackName];
          script.remove();
          reject(new Error('API key validation timed out'));
        }
      }, 10000);
    });
  }

  close() {
    this.dialogRef.close({ apiKey: null, valid: false });
  }
}
