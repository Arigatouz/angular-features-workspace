# UI Component Generator Command

## Usage

```
/ui-component <component-name> [options]
```

## Description

Generate a new Angular standalone component following the project's established patterns and conventions. This command creates a complete component with TypeScript, HTML, SCSS files, and optional README documentation.

## Arguments

- `<component-name>` - The name of the component (kebab-case recommended)

## Options

- `--type` - Component type: `page`, `modal`, `widget`, `form` (default: `widget`)
- `--with-service` - Generate an accompanying service
- `--with-readme` - Generate README documentation
- `--with-tests` - Generate test files
- `--material` - Include Material Design imports
- `--signals` - Use Angular signals (default: true)

## Examples

```bash
# Basic widget component
/ui-component user-profile

# Page component with service and README
/ui-component dashboard-page --type=page --with-service --with-readme

# Modal component with Material Design
/ui-component confirmation-modal --type=modal --material --with-tests

# Form component with all features
/ui-component contact-form --type=form --with-service --with-readme --with-tests --material
```

## Generated Files

For a component named `user-profile`:

```
projects/ai-agent/src/app/components/user-profile/
├── user-profile.ts           # Main component file
├── user-profile.html         # Template file
├── user-profile.scss         # Styles file
├── user-profile.service.ts   # Service (if --with-service)
├── user-profile.spec.ts      # Tests (if --with-tests)
└── README.md                 # Documentation (if --with-readme)
```

## Component Template Patterns

### Basic Widget Component
```typescript
import { Component, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-{{component-name}}',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './{{component-name}}.html',
  styleUrl: './{{component-name}}.scss'
})
export class {{ComponentName}} {
  // Signals for reactive state
  readonly isLoading = signal(false);
  readonly data = signal<any>(null);

  // Inputs and outputs
  readonly config = input<any>();
  readonly onAction = output<any>();

  constructor() {
    // Component initialization
  }

  // Component methods
  handleAction(): void {
    this.onAction.emit();
  }
}
```

### Page Component
```typescript
import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-{{component-name}}',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './{{component-name}}.html',
  styleUrl: './{{component-name}}.scss'
})
export class {{ComponentName}} implements OnInit {
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly pageData = signal<any>(null);

  ngOnInit(): void {
    this.loadPageData();
  }

  private async loadPageData(): Promise<void> {
    this.isLoading.set(true);
    try {
      // Load page data
    } finally {
      this.isLoading.set(false);
    }
  }
}
```

### Modal Component
```typescript
import { Component, signal, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-{{component-name}}',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './{{component-name}}.html',
  styleUrl: './{{component-name}}.scss'
})
export class {{ComponentName}} {
  private readonly dialogRef = inject(MatDialogRef<{{ComponentName}}>);
  private readonly data = inject(MAT_DIALOG_DATA);

  readonly isProcessing = signal(false);

  readonly onConfirm = output<any>();
  readonly onCancel = output<void>();

  confirm(): void {
    this.onConfirm.emit(this.data);
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.onCancel.emit();
    this.dialogRef.close(false);
  }
}
```

### Form Component
```typescript
import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-{{component-name}}',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './{{component-name}}.html',
  styleUrl: './{{component-name}}.scss'
})
export class {{ComponentName}} implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    // Form controls
  });

  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);

  ngOnInit(): void {
    this.setupForm();
  }

  private setupForm(): void {
    // Form setup logic
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;

    this.isSubmitting.set(true);
    this.submitError.set(null);

    try {
      // Form submission logic
    } catch (error: any) {
      this.submitError.set(error.message);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
```

## Material Design Imports

When `--material` flag is used, includes common Material imports:

```typescript
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
```

## Service Template

When `--with-service` is used:

```typescript
import { Injectable, signal, inject } from '@angular/core';

export interface {{ComponentName}}Data {
  // Interface definition
}

@Injectable({
  providedIn: 'root'
})
export class {{ComponentName}}Service {
  readonly isLoading = signal(false);
  readonly data = signal<{{ComponentName}}Data[]>([]);
  readonly error = signal<string | null>(null);

  async loadData(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      // Service logic
    } catch (error: any) {
      this.error.set(error.message);
    } finally {
      this.isLoading.set(false);
    }
  }
}
```

## SCSS Template

Default component styles following project patterns:

```scss
.{{component-name}}-container {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
      color: var(--mat-sys-on-surface);
    }
  }

  .content {
    flex: 1;
    padding: 16px;
  }

  .actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
}

// Responsive design
@media (max-width: 768px) {
  .{{component-name}}-container {
    gap: 12px;

    .content {
      padding: 12px;
    }
  }
}
```

## HTML Template

Basic component template:

```html
<div class="{{component-name}}-container">
  <div class="header">
    <h2>{{ComponentName}}</h2>
  </div>

  <div class="content">
    @if (isLoading()) {
      <mat-spinner></mat-spinner>
    } @else {
      <!-- Component content -->
    }
  </div>

  <div class="actions">
    <button mat-button (click)="handleAction()">
      Action
    </button>
  </div>
</div>
```

## Integration with Routing

For page components, automatic route generation suggestion:

```typescript
// Add to app.routes.ts
{
  path: '{{component-name}}',
  loadComponent: async () => (await import('./components/{{component-name}}/{{component-name}}')).{{ComponentName}}
}
```

## Best Practices Applied

1. **Standalone Components**: All components generated as standalone
2. **Angular Signals**: Modern reactive state management
3. **TypeScript Strict**: Full type safety
4. **Material Design**: Consistent UI patterns
5. **Responsive Design**: Mobile-first approach
6. **Performance**: Lazy loading and OnPush change detection
7. **Accessibility**: ARIA labels and keyboard navigation
8. **Testing**: Comprehensive test templates

## File Naming Conventions

- Component files: `kebab-case.ts`
- Class names: `PascalCase`
- Selectors: `app-kebab-case`
- Directories: `kebab-case`

## Error Handling

The command will:
- Check if component already exists
- Validate component name format
- Ensure proper project structure
- Create necessary directories
- Generate all requested files
- Update imports and routing if needed

## Command Implementation

This command should be implemented to:

1. Parse command arguments and options
2. Generate file templates with proper substitutions
3. Create component directory structure
4. Write all generated files
5. Update necessary imports and routes
6. Provide success confirmation and next steps

Use this command to maintain consistency across all components in the Angular AI Agent project while following modern Angular best practices and the established project patterns.