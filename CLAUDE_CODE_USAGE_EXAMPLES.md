# Claude Code Usage Examples for Angular AI Agent Project

## Overview

This document provides specific, actionable examples of how to use Claude Code with this Angular AI agent project. Each example includes the exact command to run and explains what context it provides to ensure consistent, high-quality development.

## Quick Reference Commands

### Essential Project Context
```bash
# Get complete project understanding
claude-code --files CLAUDE.md ANGULAR_GROUNDING_GUIDE.md

# Add configuration context
claude-code --files angular.json tsconfig.json package.json
```

### Pattern-Based Development
```bash
# Include all pattern files for comprehensive guidance
claude-code --files patterns/ config/

# Focus on specific pattern types
claude-code --files patterns/component-patterns.ts patterns/service-patterns.ts
```

## Detailed Usage Scenarios

### 1. Creating New Components

#### Basic Component Creation
```bash
claude-code \
  --files CLAUDE.md \
  --files patterns/component-patterns.ts \
  --files patterns/styling-patterns.scss \
  --files projects/ai-agent/src/app/components/text-generation/text-generation.ts \
  --prompt "Create a new conversation history sidebar component that:
  - Uses standalone component architecture
  - Implements signal-based reactive state management
  - Follows Material 3 design patterns from the project
  - Integrates with ConversationService
  - Includes proper accessibility features"
```

#### Component with Complex Forms
```bash
claude-code \
  --files CLAUDE.md \
  --files patterns/component-patterns.ts \
  --files patterns/form-patterns.ts \
  --files projects/ai-agent/src/app/components/text-generation/text-generation.ts \
  --files projects/ai-agent/src/app/services/google-gen-ai.ts \
  --prompt "Create a settings configuration component with:
  - Reactive forms using NonNullableFormBuilder
  - Model selection, temperature slider, and token limit controls
  - Form validation following project patterns
  - Integration with existing services
  - Proper error handling and user feedback"
```

### 2. Developing Services

#### API Integration Service
```bash
claude-code \
  --files CLAUDE.md \
  --files patterns/service-patterns.ts \
  --files projects/ai-agent/src/app/services/google-gen-ai.ts \
  --files projects/ai-agent/src/app/services/api-key.service.ts \
  --files config/environment-config.ts \
  --prompt "Create a new file upload service that:
  - Follows the signal-based reactive state patterns
  - Implements proper error handling with structured error types
  - Uses the same API key validation approach
  - Supports request cancellation
  - Integrates with conversation storage system"
```

#### Data Management Service
```bash
claude-code \
  --files patterns/service-patterns.ts \
  --files projects/ai-agent/src/app/services/conversation.service.ts \
  --files projects/ai-agent/src/app/services/database.service.ts \
  --prompt "Create a user preferences service that:
  - Uses signal-based state management like ConversationService
  - Persists data using the same IndexedDB patterns
  - Implements CRUD operations with proper error handling
  - Provides computed signals for UI consumption
  - Follows the migration patterns for backward compatibility"
```

### 3. Styling and UI Development

#### Creating Themed Components
```bash
claude-code \
  --files patterns/styling-patterns.scss \
  --files projects/ai-agent/src/styles.scss \
  --files projects/ai-agent/src/app/components/text-generation/text-generation.scss \
  --prompt "Create SCSS styles for a new dashboard component that:
  - Uses Material 3 theming system variables
  - Implements responsive design patterns from the project
  - Includes hover states and animations like existing components
  - Follows the chat interface layout patterns
  - Supports both light and dark themes"
```

#### Material Component Integration
```bash
claude-code \
  --files patterns/component-patterns.ts \
  --files patterns/styling-patterns.scss \
  --files projects/ai-agent/src/app/components/text-generation/text-generation.html \
  --prompt "Create a Material Design card layout component that:
  - Uses the same Material imports pattern as TextGeneration
  - Implements the project's elevation and spacing patterns
  - Includes proper accessibility attributes
  - Follows the responsive design breakpoints
  - Uses the project's color scheme and typography"
```

### 4. Feature Development

#### End-to-End Feature Implementation
```bash
claude-code \
  --files CLAUDE.md \
  --files patterns/ \
  --files projects/ai-agent/src/app/components/text-generation/ \
  --files projects/ai-agent/src/app/services/ \
  --prompt "Implement a conversation search feature that includes:
  - Search service following project service patterns
  - Search component with form validation patterns
  - Integration with existing ConversationService
  - Search results UI following message display patterns
  - Keyboard shortcuts and accessibility features
  - Proper loading states and error handling"
```

#### Adding Authentication
```bash
claude-code \
  --files patterns/service-patterns.ts \
  --files projects/ai-agent/src/app/services/api-key.service.ts \
  --files config/environment-config.ts \
  --files projects/ai-agent/src/app/services/google-gen-ai.ts \
  --prompt "Add user authentication system that:
  - Follows the API key service security patterns
  - Uses signal-based state management
  - Implements JWT token handling
  - Integrates with existing environment configuration
  - Provides proper error handling for auth failures
  - Uses session storage for security like API key service"
```

### 5. Configuration and Build

#### Environment Configuration
```bash
claude-code \
  --files config/environment-config.ts \
  --files config/angular-config.json \
  --files projects/ai-agent/src/environments/ \
  --prompt "Add a staging environment configuration that:
  - Follows the environment interface pattern
  - Includes proper validation
  - Configures build replacements in angular.json
  - Adds staging-specific API URLs and settings
  - Implements feature flags for staging features"
```

#### Build Optimization
```bash
claude-code \
  --files config/angular-config.json \
  --files config/typescript-config.json \
  --files package.json \
  --prompt "Optimize the build configuration for:
  - Better tree shaking and bundle splitting
  - Source map configuration for debugging
  - Updated bundle size budgets
  - Performance monitoring integration
  - Progressive web app features"
```

### 6. Testing Implementation

#### Component Testing
```bash
claude-code \
  --files patterns/component-patterns.ts \
  --files projects/ai-agent/src/app/components/text-generation/text-generation.spec.ts \
  --files projects/ai-agent/src/app/components/text-generation/text-generation.ts \
  --prompt "Create comprehensive tests for the TextGeneration component that:
  - Test signal-based reactive state changes
  - Mock service dependencies properly
  - Test form validation and submission
  - Test async operations and loading states
  - Follow Angular testing best practices
  - Include accessibility testing"
```

#### Service Testing
```bash
claude-code \
  --files patterns/service-patterns.ts \
  --files projects/ai-agent/src/app/services/google-gen-ai.ts \
  --prompt "Create unit tests for GoogleGenAiService that:
  - Test signal state management
  - Mock HTTP requests and responses
  - Test error handling scenarios
  - Test request cancellation
  - Verify API key validation
  - Follow the project's testing patterns"
```

### 7. Refactoring and Maintenance

#### Code Modernization
```bash
claude-code \
  --files CLAUDE.md \
  --files patterns/component-patterns.ts \
  --files projects/ai-agent/src/app/components/side-nav/ \
  --prompt "Modernize the SideNavComponent to:
  - Use signals instead of RxJS where appropriate
  - Follow the latest component patterns from TextGeneration
  - Implement proper error handling
  - Add loading states and user feedback
  - Improve accessibility
  - Update styling to match latest patterns"
```

#### Performance Optimization
```bash
claude-code \
  --files patterns/ \
  --files projects/ai-agent/src/app/components/text-generation/text-generation.ts \
  --files config/angular-config.json \
  --prompt "Optimize the application for performance by:
  - Implementing OnPush change detection where beneficial
  - Adding proper trackBy functions for lists
  - Optimizing signal computations
  - Implementing virtual scrolling for large lists
  - Adding lazy loading for routes and components
  - Following the project's performance patterns"
```

### 8. Documentation and Code Review

#### Code Review Assistance
```bash
claude-code \
  --files CLAUDE.md \
  --files patterns/ \
  --files [files-to-review] \
  --prompt "Review this code for:
  - Adherence to project patterns and conventions
  - Proper error handling implementation
  - Accessibility compliance
  - Performance considerations
  - Security best practices
  - Consistency with existing codebase
  - Suggest improvements following project standards"
```

#### Documentation Generation
```bash
claude-code \
  --files patterns/ \
  --files projects/ai-agent/src/app/services/google-gen-ai.ts \
  --prompt "Create comprehensive documentation for this service that:
  - Explains the signal-based architecture
  - Documents error handling patterns
  - Provides usage examples
  - Includes API reference
  - Follows the project's documentation style
  - Includes troubleshooting guide"
```

## Advanced Usage Patterns

### 1. Multi-File Context Development
```bash
# For complex features requiring full context
claude-code \
  --files CLAUDE.md \
  --files ANGULAR_GROUNDING_GUIDE.md \
  --files patterns/ \
  --files projects/ai-agent/src/app/components/text-generation/ \
  --files projects/ai-agent/src/app/services/google-gen-ai.ts \
  --files projects/ai-agent/src/app/services/conversation.service.ts \
  --prompt "Implement a voice-to-text feature that integrates with the existing AI conversation system"
```

### 2. Iterative Development
```bash
# Step 1: Analyze and plan
claude-code \
  --files CLAUDE.md \
  --files patterns/service-patterns.ts \
  --prompt "Analyze requirements for adding real-time collaboration features to the AI assistant"

# Step 2: Implement with full context
claude-code \
  --files patterns/service-patterns.ts \
  --files projects/ai-agent/src/app/services/ \
  --prompt "Implement the real-time collaboration service following the established patterns"

# Step 3: Create UI components
claude-code \
  --files patterns/component-patterns.ts \
  --files patterns/styling-patterns.scss \
  --prompt "Create UI components for the collaboration features"
```

### 3. Migration and Upgrades
```bash
# Angular version upgrades
claude-code \
  --files CLAUDE.md \
  --files config/ \
  --files package.json \
  --prompt "Upgrade this project to Angular 21 while maintaining all existing patterns and functionality"

# Dependency updates
claude-code \
  --files package.json \
  --files projects/ai-agent/src/app/ \
  --prompt "Update project dependencies and fix any breaking changes while preserving existing patterns"
```

## Best Practices for Claude Code Usage

### 1. Always Include Project Context
- Start with `CLAUDE.md` for project overview
- Include `ANGULAR_GROUNDING_GUIDE.md` for comprehensive context
- Add relevant pattern files for specific development tasks

### 2. Layer Context Appropriately
```bash
# Basic context (always include)
--files CLAUDE.md

# Pattern context (for development)
--files patterns/component-patterns.ts patterns/service-patterns.ts

# Specific examples (for similar functionality)
--files projects/ai-agent/src/app/components/text-generation/text-generation.ts

# Configuration context (for build/setup tasks)
--files config/
```

### 3. Use Specific, Actionable Prompts
Instead of: "Create a component"
Use: "Create a user profile component that follows the project's standalone component patterns, uses signal-based state management, and integrates with the existing authentication service"

### 4. Reference Existing Code Patterns
Always point Claude Code to similar existing functionality:
- "Follow the same patterns used in TextGeneration component"
- "Use the error handling approach from GoogleGenAiService"
- "Apply the same styling patterns as the conversation interface"

### 5. Specify Non-Functional Requirements
Include requirements for:
- Accessibility
- Performance
- Security
- Responsiveness
- Error handling
- Loading states

## Troubleshooting Common Issues

### Pattern Not Being Followed
```bash
# Add more specific pattern context
claude-code \
  --files patterns/component-patterns.ts \
  --files projects/ai-agent/src/app/components/text-generation/text-generation.ts \
  --prompt "The component I'm creating should follow EXACTLY the same patterns as TextGeneration, including: [specific requirements]"
```

### Missing Dependencies
```bash
# Include package.json and existing service examples
claude-code \
  --files package.json \
  --files projects/ai-agent/src/app/services/ \
  --prompt "Ensure all dependencies are available and follow the import patterns used in existing services"
```

### Styling Issues
```bash
# Include complete styling context
claude-code \
  --files patterns/styling-patterns.scss \
  --files projects/ai-agent/src/styles.scss \
  --files projects/ai-agent/src/app/components/text-generation/text-generation.scss \
  --prompt "Apply the exact same Material 3 theming and responsive design patterns"
```

## Summary

This grounding system provides Claude Code with comprehensive understanding of your Angular AI agent project, ensuring that all generated code:

1. **Follows Established Patterns** - Components, services, and styles match existing code
2. **Maintains Consistency** - TypeScript strict mode, Material 3 theming, signal-based state
3. **Includes Best Practices** - Error handling, accessibility, performance optimizations
4. **Integrates Seamlessly** - Works with existing services and follows architectural decisions
5. **Supports Maintainability** - Clear conventions and documentation patterns

Use these examples as starting points and modify the context files and prompts based on your specific needs.