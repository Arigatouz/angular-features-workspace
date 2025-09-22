# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Angular workspace containing an AI agent application that integrates with Google's Generative AI (Gemini models). The project uses Angular 20+ with zoneless change detection and Angular Material for UI components.

## Architecture

- **Workspace Structure**: Single Angular workspace with one application project located in `projects/ai-agent/`
- **Main Application**: Located at `projects/ai-agent/src/app/app.ts` - bootstrapped with zoneless change detection
- **Routing**: Simple routing configuration in `app.routes.ts` with lazy-loaded components
- **AI Integration**: Uses `@google/genai` library for text generation with Gemini models
- **UI Framework**: Angular Material with SCSS styling
- **Testing**: Karma + Jasmine setup for unit tests

## Key Components

- **TextGeneration** (`projects/ai-agent/src/app/components/text-generation/`): Main feature component with form-based AI text generation interface
- **SideNavComponent** (`projects/ai-agent/src/app/components/side-nav/`): Navigation component  
- **GoogleGenAiService** (`projects/ai-agent/src/app/services/google-gen-ai.ts`): Service for Google Generative AI integration

## Environment Configuration

The project uses `projects/ai-agent/src/app/Environment/environment.ts` for configuration. There's an example environment file available for reference. **Important**: The current environment.ts contains a hardcoded API key that should be moved to environment variables.

## Common Development Commands

```bash
# Start development server
npm start
# or
ng serve

# Build the project
npm run build
# or 
ng build

# Run unit tests
npm test
# or
ng test

# Build and watch for changes during development
npm run watch
# or
ng build --watch --configuration development

# Serve SSR build (when available)
npm run serve:ssr:ssr-agent
```

## Development Notes

- Uses Angular's new resource API for async data loading in text generation
- Implements reactive forms with validation for user inputs
- Features Google Gemini model selection (2.0 Flash, 1.5 Flash)
- Temperature and token limit controls for AI generation
- Copy-to-clipboard functionality for generated content
- Material Design components throughout the UI
- Zoneless change detection enabled for better performance
- when you create a new angular component always use the best practice and make sure to call the angular mcp
