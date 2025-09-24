# AI Agent Project Commands

## Usage

```
/ai-agent <action> [options]
```

## Actions

### Development
- `serve` - Start development server with optimal settings
- `build` - Build project for production
- `test` - Run unit tests
- `lint` - Run linting and fix issues
- `analyze` - Analyze bundle size

### AI Features
- `new-ai-feature <name>` - Create new AI-powered feature component
- `add-model <model-name>` - Add support for new AI model
- `update-prompts` - Update system prompts and templates

### Components
- `create-modal <name>` - Create Material modal component
- `create-page <name>` - Create new page component with routing
- `create-widget <name>` - Create reusable widget component

### Services
- `create-ai-service <name>` - Create AI service following project patterns
- `create-data-service <name>` - Create data management service

## Examples

```bash
# Start development with hot reload
/ai-agent serve

# Create new AI feature
/ai-agent new-ai-feature video-generation

# Add new AI model support
/ai-agent add-model claude-3-opus

# Create confirmation modal
/ai-agent create-modal delete-confirmation

# Create settings page
/ai-agent create-page user-settings

# Create analytics service
/ai-agent create-ai-service analytics
```

## AI Feature Template

When using `new-ai-feature <name>`:

### Generated Structure
```
projects/ai-agent/src/app/components/<feature-name>/
├── <feature-name>.ts              # Main component
├── <feature-name>.html            # Template
├── <feature-name>.scss            # Styles
├── README.md                      # Feature documentation
└── <feature-name>.service.ts      # AI service integration
```

### Service Integration
```typescript
import { Injectable, signal, inject, effect } from '@angular/core';
import { GoogleGenAI } from '@google/genai';
import { ApiKeyService } from '../api-key.service';

@Injectable({
  providedIn: 'root'
})
export class {{FeatureName}}AiService {
  private readonly apiKeyService = inject(ApiKeyService);
  private ai?: GoogleGenAI;

  readonly isInitialized = signal(false);
  readonly lastError = signal<string | null>(null);
  readonly isProcessing = signal(false);

  constructor() {
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
    this.ai = new GoogleGenAI({ apiKey });
    this.isInitialized.set(true);
  }

  private resetService(): void {
    this.ai = undefined;
    this.isInitialized.set(false);
  }

  async process{{FeatureName}}(input: string): Promise<any> {
    if (!this.ai || !this.isInitialized()) {
      throw new Error('AI service not initialized');
    }

    this.isProcessing.set(true);
    try {
      // AI processing logic
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: input
      });

      return response;
    } catch (error: any) {
      this.lastError.set(error.message);
      throw error;
    } finally {
      this.isProcessing.set(false);
    }
  }
}
```

### Component Template
```typescript
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { {{FeatureName}}AiService } from './{{feature-name}}.service';

@Component({
  selector: 'app-{{feature-name}}',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './{{feature-name}}.html',
  styleUrl: './{{feature-name}}.scss'
})
export class {{FeatureName}} {
  private readonly aiService = inject({{FeatureName}}AiService);

  // Service signals
  readonly isInitialized = this.aiService.isInitialized;
  readonly isProcessing = this.aiService.isProcessing;
  readonly error = this.aiService.lastError;

  // Component state
  readonly result = signal<any>(null);

  async process(): Promise<void> {
    try {
      const result = await this.aiService.process{{FeatureName}}('input');
      this.result.set(result);
    } catch (error) {
      console.error('Processing failed:', error);
    }
  }
}
```

## AI Model Integration

When using `add-model <model-name>`:

### Model Configuration
```typescript
export interface AIModelConfig {
  id: string;
  name: string;
  provider: 'google' | 'openai' | 'anthropic';
  capabilities: ('text' | 'image' | 'audio' | 'video')[];
  maxTokens: number;
  pricing: {
    input: number;
    output: number;
  };
}

export const AI_MODELS: AIModelConfig[] = [
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    capabilities: ['text'],
    maxTokens: 8192,
    pricing: { input: 0.075, output: 0.30 }
  },
  // New model added here
];
```

### Service Update
```typescript
// Updated service to support multiple models
async generateWithModel(
  modelId: string,
  prompt: string,
  options?: any
): Promise<any> {
  const modelConfig = AI_MODELS.find(m => m.id === modelId);
  if (!modelConfig) {
    throw new Error(`Model ${modelId} not supported`);
  }

  // Model-specific generation logic
}
```

## Build and Deployment

### Optimized Build
```bash
/ai-agent build
# Runs: ng build --configuration production --optimization=true
```

### Bundle Analysis
```bash
/ai-agent analyze
# Generates bundle size analysis and optimization suggestions
```

## Project Standards

All generated components follow:
- **Standalone Architecture**: No NgModules
- **Signal-based State**: Reactive programming
- **Material Design 3**: Consistent UI
- **TypeScript Strict**: Full type safety
- **Performance**: Lazy loading and optimization
- **Accessibility**: WCAG 2.1 compliance
- **Testing**: Unit test templates

## Integration Points

### Routing
Auto-updates `app.routes.ts` with new routes:
```typescript
{
  path: '{{feature-name}}',
  loadComponent: async () => (await import('./components/{{feature-name}}/{{feature-name}}')).{{FeatureName}}
}
```

### Navigation
Updates `side-nav.component.html`:
```html
<a mat-list-item routerLink="{{feature-name}}" routerLinkActive="active-route">
  <mat-icon matListItemIcon>{{icon}}</mat-icon>
  <span matListItemTitle>{{Feature Name}}</span>
</a>
```

### Services Registration
Updates service providers if needed in `app.ts`.

## Development Workflow

1. Use `/ai-agent new-ai-feature <name>` to create new features
2. Implement AI logic in generated service
3. Build UI in component following Material Design
4. Add routing and navigation
5. Write tests and documentation
6. Build and deploy with `/ai-agent build`

This command system ensures all new code follows the established patterns and integrates seamlessly with the existing AI agent architecture.