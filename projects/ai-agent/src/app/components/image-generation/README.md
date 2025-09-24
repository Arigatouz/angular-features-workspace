# Image Generation Component

## Overview

The ImageGeneration component is a real AI-powered image creation interface built with Angular 20+ and Material 3. It uses Google's Gemini 2.5 Flash Image Preview model to generate high-quality images from text prompts, seamlessly integrated with the existing AI agent architecture. The component follows the same patterns and conventions as the TextGeneration component for consistency.

## Features

### 🎨 **AI Image Generation**
- **Google Gemini 2.5 Flash Image Preview**: Real AI-powered image generation
- **Multiple Styles**: Realistic, Artistic, Cartoon, Photographic with intelligent prompt enhancement
- **Quality Options**: Standard and HD generation with detailed specifications
- **Batch Generation**: Create 1-4 images at once with automatic variations
- **Base64 Image Support**: Generated images are returned as data URLs for immediate display

### 🖼️ **Image Gallery**
- **Visual Grid Layout**: Responsive image gallery with cards
- **Image Management**: View, download, copy URL, remove individual images
- **Generation History**: Persistent storage of created images
- **Metadata Display**: Shows prompt, settings, and timestamp
- **Batch Operations**: Clear all images with confirmation

### 🛠️ **Advanced Features**
- **Expandable Settings**: Collapsible configuration panel
- **Real-time Validation**: Form validation with user feedback
- **Progress Indicators**: Loading states and generation feedback
- **Request Cancellation**: Stop generation in progress
- **Keyboard Shortcuts**: Ctrl+Enter to generate, Escape to clear

### 🔐 **Security & Integration**
- **API Key Management**: Reuses existing ApiKeyService
- **Service Architecture**: Follows GoogleGenAiService patterns
- **Error Handling**: Structured error types and user feedback
- **Responsive Design**: Works on all device sizes

## Architecture

### Component Structure
```
image-generation/
├── image-generation.ts          # Main component logic
├── image-generation.html        # Template with Material components
├── image-generation.scss        # Styling following project patterns
└── README.md                    # This documentation
```

### Service Architecture
```typescript
// ImageGenAiService follows GoogleGenAiService patterns
@Injectable({ providedIn: 'root' })
export class ImageGenAiService {
  readonly isInitialized = signal(false);
  readonly lastError = signal<ImageGenerationError | null>(null);
  readonly isGenerating = signal(false);
  readonly generatedImages = signal<ImageGenerationResponse[]>([]);
}
```

### Key Dependencies
- **@angular/core**: Signals, effects, reactive patterns
- **@angular/forms**: NonNullableFormBuilder with validation
- **@angular/material**: UI components, grid, chips, progress bars
- **@angular/cdk**: Text field auto-resize
- **ImageGenAiService**: Custom service for image generation

## Usage

### Routing Configuration
```typescript
// Lazy-loaded route
{
  path: 'image-generation',
  loadComponent: async () => (await import('./components/image-generation/image-generation')).ImageGeneration
}
```

### Form Configuration
```typescript
form = this.fb.group({
  prompt: [this.DEFAULT_PROMPT, [Validators.required, Validators.minLength(3)]],
  style: ['realistic', Validators.required],
  size: ['512x512', Validators.required],
  quality: ['standard', Validators.required],
  count: [1, [Validators.min(1), Validators.max(4)]],
});
```

### Generation Process
```typescript
async generateImages() {
  // Disable form during generation (fixing reactive forms warning)
  this.form.get('prompt')?.disable();

  try {
    const response = await this.imageGenAiService.generateImage({
      prompt: prompt,
      style: style as any,
      size: size as any,
      quality: quality as any,
      count: count,
      model: 'imagen-2'
    });

    // Images automatically added to gallery via service signal
  } finally {
    this.form.get('prompt')?.enable();
  }
}
```

## Configuration

### Style Options
```typescript
readonly styleOptions = [
  {id: 'realistic', label: 'Realistic'},
  {id: 'artistic', label: 'Artistic'},
  {id: 'cartoon', label: 'Cartoon'},
  {id: 'photographic', label: 'Photographic'},
];
```

### Size Options
```typescript
readonly sizeOptions = [
  {id: '512x512', label: 'Square (512×512)'},
  {id: '1024x1024', label: 'Large Square (1024×1024)'},
  {id: '1024x1792', label: 'Portrait (1024×1792)'},
  {id: '1792x1024', label: 'Landscape (1792×1024)'},
];
```

### Real AI Implementation
```typescript
// Real Google Gemini AI image generation
private async simulateImageGeneration(request, abortSignal) {
  const response = await this.ai.models.generateContent({
    model: "gemini-2.5-flash-image-preview",
    contents: this.enhancePromptWithStyle(request.prompt, request.style, request.quality),
  });

  // Extract base64 image data from response
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
      const imageData = part.inlineData.data;
      const mimeType = part.inlineData.mimeType;
      const dataUrl = `data:${mimeType};base64,${imageData}`;

      images.push({ url: dataUrl, revisedPrompt: enhancedPrompt });
    }
  }

  return { images, prompt, model: 'gemini-2.5-flash-image-preview', timestamp: new Date(), metadata };
}
```

## Development

### Prompt Enhancement System
The service automatically enhances prompts for better AI results:

```typescript
// Enhances prompts with style and quality specifications
private enhancePromptWithStyle(basePrompt: string, style?: string, quality?: string, variation?: number): string {
  let enhancedPrompt = basePrompt;

  // Add style specifications
  switch (style) {
    case 'artistic':
      enhancedPrompt += ', artistic style, creative interpretation, expressive brushstrokes';
      break;
    case 'cartoon':
      enhancedPrompt += ', cartoon style, animated, colorful, stylized illustration';
      break;
    case 'photographic':
      enhancedPrompt += ', photographic style, realistic photography, professional lighting';
      break;
    default: // realistic
      enhancedPrompt += ', realistic style, detailed, high-quality rendering';
      break;
  }

  // Add quality specifications
  if (quality === 'hd') {
    enhancedPrompt += ', high definition, sharp details, professional quality';
  }

  // Add variations for multiple images
  if (variation && variation > 0) {
    const variations = [', different angle', ', alternative composition', ', varied lighting', ', different perspective'];
    enhancedPrompt += variations[variation % variations.length];
  }

  return enhancedPrompt;
}
```

### Extending Image Formats
```typescript
// Add support for different image formats
readonly formatOptions = [
  {id: 'jpeg', label: 'JPEG'},
  {id: 'png', label: 'PNG'},
  {id: 'webp', label: 'WebP'}
];
```

### Custom Styling
```scss
// Override image gallery layout
.images-grid {
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}
```

## User Interface

### Form Layout
```html
<!-- Expandable settings panel -->
<div class="settings-panel" [class.collapsed]="!settingsExpanded()">
  <div class="settings-header" (click)="toggleSettings()">
    <h3>Generation Settings</h3>
    <button mat-icon-button>
      <mat-icon>{{ settingsExpanded() ? 'keyboard_arrow_up' : 'keyboard_arrow_down' }}</mat-icon>
    </button>
  </div>
</div>

<!-- Main prompt input with auto-resize -->
<textarea matInput
          cdkTextareaAutosize
          cdkAutosizeMinRows="3"
          cdkAutosizeMaxRows="6"
          formControlName="prompt">
</textarea>
```

### Image Gallery
```html
<div class="image-gallery">
  @for (response of generatedImages(); track response.timestamp) {
    <div class="generation-group">
      <div class="images-grid">
        @for (image of response.images; track image.url) {
          <mat-card class="image-card">
            <img [src]="image.url" [alt]="getImageAlt(response, i)">
            <div class="image-actions">
              <button (click)="downloadImage(image.url, response.prompt)">
                <mat-icon>download</mat-icon>
              </button>
            </div>
          </mat-card>
        }
      </div>
    </div>
  }
</div>
```

## Performance

### Bundle Size
- **Lazy Loading**: ~85.59 kB chunk size
- **Efficient Imports**: Tree-shaken Material components
- **Image Optimization**: Lazy loading for gallery images

### Memory Management
```typescript
// Clean up generated images when needed
clearGeneratedImages(): void {
  this.generatedImages.set([]);
}

// Remove specific images to free memory
removeGeneratedImage(index: number): void {
  const currentImages = this.generatedImages();
  const updatedImages = currentImages.filter((_, i) => i !== index);
  this.generatedImages.set(updatedImages);
}
```

## Testing

### Unit Tests
```typescript
describe('ImageGeneration', () => {
  it('should generate images with valid form', async () => {
    component.form.patchValue({
      prompt: 'A beautiful sunset',
      style: 'realistic',
      size: '512x512'
    });

    await component.generateImages();
    expect(component.generatedImages().length).toBeGreaterThan(0);
  });
});
```

### E2E Tests
```typescript
test('image generation flow', async ({ page }) => {
  await page.goto('/image-generation');
  await page.fill('[formControlName="prompt"]', 'Test image prompt');
  await page.click('button[type="submit"]');
  await expect(page.locator('.image-card')).toBeVisible();
});
```

## Accessibility

### WCAG 2.1 Compliance
- **Alt Text**: Descriptive alt text for all generated images
- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Readers**: Proper ARIA labels and roles
- **Color Contrast**: High contrast support with CSS variables

### Keyboard Shortcuts
- `Ctrl + Enter`: Generate images
- `Escape`: Clear prompt
- `Tab`: Navigate through form fields and image actions
- `Enter`: Activate buttons and actions

## Troubleshooting

### Common Issues

**Images Not Loading**
```typescript
// Add error handling for image loading
<img [src]="image.url"
     (error)="$event.target.src='fallback-image.jpg'" />
```

**Form Disabled Warning**
- Fixed by programmatically disabling form controls instead of using `[disabled]`
- Forms are disabled during generation and re-enabled after completion

**Memory Issues with Large Images**
- Implement image compression before display
- Add pagination for large image galleries
- Use intersection observer for lazy loading

### Debug Mode
```typescript
// Enable image generation debugging
if (!environment.production) {
  console.log('Image generation request:', request);
  console.log('Generated images:', response);
}
```

## Integration

### Navigation Integration
```html
<!-- Sidebar navigation -->
<a mat-list-item routerLink="image-generation" routerLinkActive="active-route">
  <mat-icon matListItemIcon>image</mat-icon>
  <span matListItemTitle>Image Generation</span>
</a>
```

### Service Integration
- **ApiKeyService**: Reuses existing API key management
- **ConversationService**: Could be extended to store image generations
- **Shared Error Handling**: Same error patterns and user feedback

## Future Enhancements

### Potential Features
- **Image Editing**: Basic crop, resize, filters for generated images
- **Prompt Suggestions**: AI-generated prompt recommendations based on successful prompts
- **Image Variations**: Generate variations of existing images using base64 data
- **Batch Download**: Download multiple images as ZIP from data URLs
- **Social Sharing**: Share generated images directly to social platforms
- **Image Size Options**: Support for additional Gemini model size specifications
- **Advanced Prompt Engineering**: More sophisticated prompt enhancement techniques

### API Key Requirements
```typescript
// Ensure your Google AI Studio API key has access to:
// - Gemini 2.5 Flash Image Preview model
// - Image generation quotas
// - Proper billing setup for image generation requests
```

## Contributing

### Development Guidelines
1. Follow existing patterns from `patterns/component-patterns.ts`
2. Use signal-based reactive state management
3. Maintain consistency with TextGeneration component
4. Include proper TypeScript types
5. Add unit tests for new features
6. Follow Material Design 3 guidelines

### Code Style
- Use `inject()` for dependency injection
- Implement proper error boundaries
- Follow reactive forms best practices
- Use semantic HTML and ARIA attributes

## Related Files

- **ImageGenAiService**: `../services/image-gen-ai.ts`
- **Component Patterns**: `../../../../patterns/component-patterns.ts`
- **Styling Patterns**: `../../../../patterns/styling-patterns.scss`
- **Usage Examples**: `../../../../CLAUDE_CODE_USAGE_EXAMPLES.md`