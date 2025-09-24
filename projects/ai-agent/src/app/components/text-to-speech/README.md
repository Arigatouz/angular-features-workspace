# Text-to-Speech Component

## Overview

The Text-to-Speech component provides a user-friendly interface for converting text into natural-sounding speech using Google's Generative AI text-to-speech capabilities. It features voice selection, audio generation, and download functionality with a comprehensive history management system.

## Features

### Core Functionality
- **Text Input**: Multi-line text input with validation and auto-resize
- **Voice Selection**: Multiple voice options (Kore, Charon, Fenrir, Aoede)
- **Audio Generation**: Real-time speech synthesis using Google's `gemini-2.5-flash-preview-tts` model
- **Audio Download**: Automatic WAV file generation and download
- **History Management**: Track and manage generated audio files

### User Interface
- **Responsive Design**: Adapts to different screen sizes with mobile-first approach
- **Material Design**: Consistent UI using Angular Material components
- **Real-time Feedback**: Progress indicators, error handling, and success notifications
- **Accessibility**: Keyboard navigation and screen reader support

## Technical Architecture

### Component Structure
```
text-to-speech/
├── text-to-speech.ts          # Main component logic
├── text-to-speech.html        # Template file
├── text-to-speech.scss        # Styles and responsive design
└── README.md                  # This documentation
```

### Dependencies
- **TextToSpeechService**: Handles API communication with Google GenAI
- **ApiKeyService**: Manages API key validation and storage
- **Angular Material**: UI components and theming
- **Angular Reactive Forms**: Form validation and data binding

### Service Integration
The component integrates with `TextToSpeechService` which provides:
- Google GenAI client initialization
- Audio generation with PCM data handling
- WAV file creation and download functionality
- Error handling and request cancellation

## Usage

### Basic Usage
1. Enter text in the input field (minimum 2 characters)
2. Select a voice from the dropdown menu
3. Click "Generate Speech" to create audio
4. Audio file downloads automatically as WAV format

### Advanced Features
- **Voice Options**: Choose from 4 different voice personalities
- **History Management**: View, download, or remove previous generations
- **Copy Functions**: Copy text content to clipboard
- **Bulk Operations**: Clear all history at once

### Keyboard Shortcuts
- **Enter**: Generate speech (when input is focused)
- **Escape**: Dismiss error messages

## API Integration

### Google GenAI Configuration
```typescript
model: "gemini-2.5-flash-preview-tts"
contents: [{ parts: [{ text: inputText }] }]
config: {
  responseModalities: ['AUDIO'],
  speechConfig: {
    voiceConfig: {
      prebuiltVoiceConfig: { voiceName: selectedVoice }
    }
  }
}
```

### Audio Processing
- **Input**: Text string and voice selection
- **Processing**: Google GenAI returns base64-encoded PCM data
- **Output**: Browser-compatible WAV file with proper headers

## Error Handling

The component provides comprehensive error handling for:
- **API Key Issues**: Missing or invalid API keys
- **Network Errors**: Connection problems
- **Rate Limiting**: API quota exceeded
- **Invalid Requests**: Malformed input or parameters
- **Browser Compatibility**: Unsupported features

## Responsive Design

### Breakpoints
- **Desktop (1024px+)**: Sidebar layout with full features
- **Tablet (768px-1024px)**: Stacked layout with adjusted sidebar
- **Mobile (<768px)**: Single column with optimized touch targets

### Layout Features
- **Flexible Grid**: CSS Grid and Flexbox for responsive layouts
- **Touch-Friendly**: Appropriate button sizes and spacing for mobile
- **Content Overflow**: Scrollable areas with custom scrollbars

## Accessibility Features

- **ARIA Labels**: Proper labeling for screen readers
- **Keyboard Navigation**: Full keyboard support for all interactions
- **Focus Management**: Logical tab order and visible focus indicators
- **Color Contrast**: Meets WCAG guidelines for text visibility
- **Error Announcements**: Screen reader compatible error messages

## Performance Considerations

- **Lazy Loading**: Component loads on-demand via Angular routing
- **Memory Management**: Proper cleanup of audio data and event listeners
- **Request Cancellation**: Abort ongoing requests when needed
- **Optimized Rendering**: OnPush change detection strategy

## Browser Compatibility

### Supported Features
- **Web Audio API**: For audio processing and playback
- **File Download API**: For WAV file downloads
- **Clipboard API**: For copy functionality
- **Local Storage**: For API key persistence

### Minimum Requirements
- Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- ES2020 support
- Web Audio API support
- 2MB+ available memory for audio processing

## Configuration

### Environment Variables
The component uses the shared API key configuration:
```typescript
// API key managed by ApiKeyService
// No direct environment configuration needed
```

### Customization Options
- **Voice List**: Modify `voiceOptions` array in component
- **Default Text**: Change `DEFAULT_TEXT` constant
- **Audio Format**: Configure sample rate and bit depth in service
- **UI Theme**: Customize SCSS variables for colors and spacing

## Testing

### Unit Tests
- Form validation logic
- Service integration
- Error handling scenarios
- User interaction flows

### Integration Tests
- API communication
- File download functionality
- Audio processing pipeline
- Cross-browser compatibility

## Troubleshooting

### Common Issues
1. **No Audio Generated**: Check API key validity and network connection
2. **Download Fails**: Verify browser support for File API
3. **Voice Not Working**: Ensure selected voice is supported by the API
4. **Layout Issues**: Check responsive design breakpoints and CSS conflicts

### Debug Information
Enable console logging to see:
- API request/response details
- Audio processing steps
- Error details and stack traces
- Performance metrics

## Future Enhancements

### Planned Features
- **Audio Preview**: Play audio in browser before download
- **Batch Processing**: Generate multiple audio files at once
- **Custom Voices**: Support for user-trained voice models
- **Audio Effects**: Speed, pitch, and volume controls
- **Export Options**: Multiple audio format support (MP3, OGG, etc.)

### Performance Improvements
- **Audio Streaming**: Real-time playback during generation
- **Caching**: Store frequently used audio files
- **Compression**: Optimize file sizes for faster downloads
- **Background Processing**: Non-blocking audio generation