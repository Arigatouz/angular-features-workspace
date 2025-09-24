# Angular AI Agent Project - Grounding Guide for Claude Code

## Overview

This document provides a comprehensive grounding context for Claude Code when working with
this Angular 20+ AI agent application. Use this guide to ensure consistent development patterns,
architectural decisions, and coding conventions.

## Project Architecture Summary

### Core Technologies & Versions
- **Angular 20.3+** with zoneless change detection
- **Angular Material 20.2+** with Material 3 design system
- **TypeScript 5.8+** with strict mode enabled
- **@google/genai 1.19+** for AI integration
- **Dexie 4.2+** for local database storage
- **Marked 16.3+** for markdown processing

### Workspace Structure
```
angular-features-workspace/
├── projects/ai-agent/                 # Main application
│   ├── src/app/                      # Application source
│   │   ├── components/               # Standalone components
│   │   ├── services/                 # Injectable services
│   │   ├── pipes/                    # Custom pipes
│   │   └── environments/             # Environment configurations
│   └── public/                       # Static assets
├── CLAUDE.md                         # Project instructions (CRITICAL)
└── angular.json                      # Workspace configuration
```

## Key Architectural Patterns

### 1. Standalone Components (No NgModules)
- All components use `standalone: true`
- Imports declared directly in component decorator
- Lazy-loaded routing with dynamic imports

### 2. Reactive State Management with Signals
- Heavy use of `signal()`, `computed()`, and `effect()`
- Service-level signal-based state management
- Reactive patterns with `afterRenderEffect()`

### 3. Modern Dependency Injection
- Use `inject()` function instead of constructor injection
- Service providers at component level when needed
- Reactive service initialization with effects

### 4. Error Handling Patterns
- Structured error interfaces with type discrimination
- Service-level error signals with reactive updates
- User-friendly error messaging with Material snackbars

## Critical Files for Grounding Context

### Essential Project Files
```bash
# Core architecture files
@projects/ai-agent/src/app/app.ts                    # Root component with zoneless bootstrap
@projects/ai-agent/src/app/app.routes.ts             # Lazy-loaded routing configuration
@projects/ai-agent/src/app/app.config.ts             # Application configuration

# Key component examples
@projects/ai-agent/src/app/components/text-generation/text-generation.ts    # Complex component pattern
@projects/ai-agent/src/app/components/side-nav/side-nav.component.ts        # Navigation component

# Service architecture examples
@projects/ai-agent/src/app/services/google-gen-ai.ts        # AI service with error handling
@projects/ai-agent/src/app/services/conversation.service.ts  # Data management service
@projects/ai-agent/src/app/services/api-key.service.ts      # Security service pattern

# Configuration references
@angular.json                                        # Build and development configuration
@tsconfig.json                                       # TypeScript strict configuration
@projects/ai-agent/src/styles.scss                   # Material 3 theming patterns
@projects/ai-agent/src/environments/environment.ts   # Environment configuration
```

### Documentation Files
```bash
CLAUDE.md                              # Project instructions (READ FIRST)
package.json                           # Dependencies and scripts
```

## Grounding Strategies for Claude Code

### 1. File-Based Grounding
Include key architectural files for context:

```bash
# Basic project context
claude-code --files CLAUDE.md package.json angular.json tsconfig.json

# Component development context
claude-code --files \
  projects/ai-agent/src/app/components/text-generation/text-generation.ts \
  projects/ai-agent/src/app/services/google-gen-ai.ts \
  projects/ai-agent/src/styles.scss

# Service development context
claude-code --files \
  projects/ai-agent/src/app/services/ \
  projects/ai-agent/src/app/components/text-generation/text-generation.ts
```

### 2. Pattern-Specific Grounding
Target specific development patterns:

```bash
# Angular signals and reactive patterns
claude-code --files \
  projects/ai-agent/src/app/components/text-generation/text-generation.ts \
  projects/ai-agent/src/app/services/google-gen-ai.ts \
  --prompt "Create a new component following the reactive signal patterns used in this project"

# Material 3 UI patterns
claude-code --files \
  projects/ai-agent/src/app/components/text-generation/text-generation.html \
  projects/ai-agent/src/app/components/text-generation/text-generation.scss \
  projects/ai-agent/src/styles.scss \
  --prompt "Create a Material 3 form component following this project's design patterns"

# Service architecture patterns
claude-code --files \
  projects/ai-agent/src/app/services/google-gen-ai.ts \
  projects/ai-agent/src/app/services/api-key.service.ts \
  --prompt "Create a new service following the error handling and signal patterns"
```

### 3. Complete Development Context
For complex features requiring full project understanding:

```bash
claude-code \
  --files CLAUDE.md \
  --files projects/ai-agent/src/app/ \
  --files package.json angular.json tsconfig.json \
  --prompt "Add a new feature that integrates with the existing AI conversation system"
```

### 4. Configuration and Build Context
For build, deployment, or configuration changes:

```bash
claude-code \
  --files angular.json package.json tsconfig.json \
  --files projects/ai-agent/src/environments/ \
  --prompt "Update build configuration following project conventions"
```

## Development Workflow Examples

### Creating a New Component
```bash
# Step 1: Establish component patterns context
claude-code \
  --files projects/ai-agent/src/app/components/text-generation/text-generation.ts \
  --files projects/ai-agent/src/app/components/side-nav/side-nav.component.ts \
  --prompt "Analyze the component patterns used in this project"

# Step 2: Create component with full context
claude-code \
  --files CLAUDE.md \
  --files projects/ai-agent/src/app/components/ \
  --files projects/ai-agent/src/styles.scss \
  --prompt "Create a new conversation history component that:
  - Uses standalone component architecture
  - Implements reactive signals for state management
  - Follows Material 3 design patterns
  - Uses the same error handling patterns
  - Integrates with ConversationService"
```

### Adding a New Service
```bash
claude-code \
  --files projects/ai-agent/src/app/services/google-gen-ai.ts \
  --files projects/ai-agent/src/app/services/conversation.service.ts \
  --files projects/ai-agent/src/app/services/api-key.service.ts \
  --prompt "Create a new settings service that:
  - Uses signal-based reactive state management
  - Implements the same error handling patterns
  - Follows the injection and initialization patterns
  - Persists data using the same storage approach"
```

### Extending Existing Features
```bash
claude-code \
  --files projects/ai-agent/src/app/components/text-generation/ \
  --files projects/ai-agent/src/app/services/google-gen-ai.ts \
  --files projects/ai-agent/src/app/services/conversation.service.ts \
  --prompt "Add file upload capability to the text generation component that:
  - Follows the existing form validation patterns
  - Uses the same error handling approach
  - Integrates with the conversation storage system
  - Maintains the same UI/UX patterns"
```

## Key Conventions to Follow

### Code Style & Patterns
1. **Signals First**: Use `signal()`, `computed()`, `effect()` for reactive state
2. **Standalone Components**: Never create NgModules, always use standalone
3. **Inject Function**: Use `inject()` instead of constructor injection
4. **Reactive Forms**: Use `NonNullableFormBuilder` with validation
5. **Error Handling**: Structured error objects with type discrimination
6. **Material 3**: Follow Material Design 3 patterns and theming

### File Organization
1. **Component Structure**: `.ts`, `.html`, `.scss`, `.spec.ts` files
2. **Service Location**: All services in `src/app/services/`
3. **Environment Config**: Use environment files for configuration
4. **Assets**: Static files in `projects/ai-agent/public/`

### TypeScript Configuration
1. **Strict Mode**: Always enabled with additional strict flags
2. **Modern Target**: ES2022 target with module preservation
3. **Experimental Decorators**: Enabled for Angular compatibility

## Benefits of This Grounding Approach

### 1. Consistency Enforcement
- Ensures all new code follows established patterns
- Maintains architectural decisions across development team
- Reduces code review time by following conventions

### 2. Quality Assurance
- Built-in error handling patterns prevent common issues
- TypeScript strict mode catches errors early
- Reactive patterns ensure proper state management

### 3. Development Speed
- Pre-established patterns accelerate feature development
- Comprehensive examples reduce research time
- Consistent structure improves code navigation

### 4. Maintainability
- Clear service boundaries and responsibilities
- Reactive state management simplifies debugging
- Material 3 theming provides consistent UI evolution

### 5. Knowledge Transfer
- New developers can quickly understand patterns
- Documentation provides context for architectural decisions
- Examples demonstrate proper implementation techniques

## Step-by-Step Analysis Process

This grounding guide was created through the following systematic analysis:

### 1. Architecture Discovery
- ✅ Analyzed workspace configuration (`angular.json`)
- ✅ Examined TypeScript configuration and strict mode settings
- ✅ Identified Angular 20+ features (zoneless, standalone components)
- ✅ Mapped dependency structure and versions

### 2. Pattern Extraction
- ✅ Analyzed signal-based reactive patterns in components
- ✅ Extracted service architecture and error handling patterns
- ✅ Identified Material 3 integration and theming approach
- ✅ Documented form validation and user interaction patterns

### 3. Convention Documentation
- ✅ File naming and organization conventions
- ✅ Code style patterns and TypeScript usage
- ✅ Dependency injection and service initialization patterns
- ✅ Error handling and user feedback mechanisms

### 4. Integration Points
- ✅ Google GenAI service integration patterns
- ✅ Local storage and conversation management
- ✅ API key security and validation patterns
- ✅ Component communication and data flow

## Usage Instructions

1. **Always start with CLAUDE.md** - Contains critical project context
2. **Include relevant pattern files** - Use examples from this guide
3. **Specify architectural requirements** - Reference standalone, signals, Material 3
4. **Include error handling context** - Use service examples for proper error patterns
5. **Reference configuration files** - Include build and TypeScript settings when relevant

This grounding system ensures that Claude Code has comprehensive context about your Angular AI agent project, enabling consistent, high-quality development that follows your established patterns and architectural decisions.
