# Text Generation Component

## Overview

The TextGeneration component is the core AI conversation interface of this Angular application. It provides a comprehensive chat-like experience for interacting with Google's Generative AI models, featuring conversation management, advanced settings, and a rich messaging interface.

## Features

### 🤖 **AI Text Generation**
- **Multiple Models**: Support for Gemini 2.0 Flash and Gemini 1.5 Flash
- **Customizable Parameters**: Temperature control (0-2), max output tokens (1-8192)
- **Real-time Generation**: Live response streaming with progress indicators
- **Request Cancellation**: Stop generation at any time

### 💬 **Conversation Management**
- **Persistent Conversations**: Auto-saved to IndexedDB
- **Conversation History**: Browse and manage multiple conversations
- **Smart Titles**: Auto-generated from first message
- **Conversation Actions**: Rename, delete, export individual conversations
- **Bulk Operations**: Clear all conversations, export all data

### 📱 **Rich UI Features**
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Material 3 Theming**: Modern design system with custom theming
- **Markdown Support**: Rich text rendering in AI responses
- **Message Actions**: Copy individual messages or entire conversations
- **Typing Indicators**: Visual feedback during generation
- **Error Handling**: User-friendly error messages and recovery

### 🔐 **Security & Configuration**
- **API Key Management**: Secure session storage with validation
- **Environment Support**: Development and production configurations
- **Privacy First**: No data sent to external servers except AI API

## Architecture

### Component Structure
```
text-generation/
├── text-generation.ts          # Main component logic
├── text-generation.html        # Template with Material components
├── text-generation.scss        # Styling with Material 3 theming
└── text-generation.spec.ts     # Unit tests
```

### Key Dependencies
- **@angular/core**: Signals, effects, reactive patterns
- **@angular/forms**: Reactive forms with validation
- **@angular/material**: UI components and theming
- **@google/genai**: Google Generative AI integration
- **marked**: Markdown parsing and rendering

### State Management
- **Signal-based**: Modern Angular reactive state management
- **Service Integration**: GoogleGenAiService, ConversationService, ApiKeyService
- **Computed Properties**: Derived state for UI logic
- **Effects**: Reactive side effects and DOM manipulation

## Usage

### Basic Usage
```typescript
// Component is lazy-loaded through routing
{
  path: 'text-generation',
  loadComponent: async () => (await import('./components/text-generation/text-generation')).TextGeneration
}
```

### Form Configuration
```typescript
form = this.fb.group({
  prompt: [this.DEFAULT_TEXT, [Validators.required, Validators.minLength(2)]],
  model: [this.models[0].id, Validators.required],
  temperature: [0.7],
  maxOutputTokens: [512, [Validators.min(1), Validators.max(8192)]],
});
```

### Service Integration
```typescript
// AI Generation
const response = await this.googleGenAiService.generateContent({
  model: model || 'gemini-2.0-flash',
  prompt: prompt,
  temperature: temperature || 0.7,
  maxOutputTokens: maxOutputTokens || 512
});

// Conversation Storage
await this.conversationService.addMessage(response.text, 'assistant', {
  temperature,
  maxTokens: maxOutputTokens,
  tokensUsed: response.tokensUsed
});
```

## Configuration

### Environment Variables
```typescript
export const environment = {
  production: false,
  GOOGLE_API_KEY: '' // Users provide API keys through the modal
};
```

### Model Options
```typescript
readonly models = [
  {id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash'},
  {id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash'},
];
```

## Development

### Adding New Models
1. Update `models` array in component
2. Add model-specific configuration in GoogleGenAiService
3. Update validation and UI labels

### Extending Features
```typescript
// Example: Adding voice input
async startVoiceInput() {
  const recognition = new SpeechRecognition();
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    this.form.patchValue({ prompt: transcript });
  };
  recognition.start();
}
```

### Custom Styling
```scss
// Override Material 3 theme variables
:host ::ng-deep {
  --mat-sys-primary: #your-color;
  --mat-sys-on-primary: #your-text-color;
}
```

## Testing

### Unit Tests
```bash
ng test --component=text-generation
```

### E2E Testing
```typescript
// Test conversation flow
it('should generate and save conversation', async () => {
  await page.fill('[formControlName="prompt"]', 'Test prompt');
  await page.click('[type="submit"]');
  await expect(page.locator('.message-assistant')).toBeVisible();
});
```

## Performance

### Bundle Size
- **Lazy Loading**: ~143.70 kB chunk size
- **Tree Shaking**: Optimized Material imports
- **Code Splitting**: Separate route chunk

### Optimization Tips
- Use OnPush change detection for large conversation lists
- Implement virtual scrolling for 1000+ messages
- Cache API responses for repeated prompts

## Accessibility

### WCAG Compliance
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper ARIA labels and roles
- **High Contrast**: Support for high contrast mode
- **Focus Management**: Logical tab order

### Keyboard Shortcuts
- `Enter`: Send message (in textarea)
- `Shift + Enter`: New line
- `Ctrl + Enter`: Force send
- `Escape`: Clear input

## Troubleshooting

### Common Issues

**API Key Not Working**
- Check API key format and permissions
- Verify network connectivity
- Check browser console for detailed errors

**Conversations Not Saving**
- Verify IndexedDB is supported and enabled
- Check browser storage limits
- Look for CORS issues in development

**Poor Generation Quality**
- Adjust temperature (lower = more focused)
- Increase max output tokens
- Try different model variants

### Debug Mode
```typescript
// Enable debug logging
if (environment.production === false) {
  console.log('Generation request:', request);
  console.log('API response:', response);
}
```

## Contributing

### Code Style
- Follow existing patterns from `patterns/component-patterns.ts`
- Use signal-based reactive state
- Implement proper error handling
- Add TypeScript types for all interfaces

### Pull Request Guidelines
1. Include unit tests for new features
2. Update documentation
3. Follow Material Design guidelines
4. Test on mobile devices

## Related Components

- **ImageGeneration**: Sister component for image generation
- **TextToSpeechGeneration**: Convert text to natural-sounding speech using Google's TTS AI
- **VideoUnderstanding**: Analyze and understand YouTube videos using Google's vision models
- **SideNavComponent**: Navigation between all AI generation features
- **ApiKeyModalComponent**: Shared API key management across all components