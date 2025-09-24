# Claude Code Commands for Angular AI Agent

This directory contains custom commands for the Angular AI Agent project to streamline development and maintain consistency.

## Available Commands

### 🎨 UI Component Generation

#### `/ui-component <name> [options]`
Generate complete Angular standalone components with all files and patterns.

**Options:**
- `--type` - Component type: `page`, `modal`, `widget`, `form`
- `--with-service` - Generate accompanying service
- `--with-readme` - Generate documentation
- `--with-tests` - Generate test files
- `--material` - Include Material Design imports
- `--signals` - Use Angular signals (default: true)

**Examples:**
```bash
/ui-component user-profile
/ui-component dashboard-page --type=page --with-service --with-readme
/ui-component confirmation-modal --type=modal --material
```

### 🔧 Quick Generation

#### `/generate <type> <name>`
Quick generator for common Angular artifacts.

**Types:** `component`, `service`, `pipe`, `guard`, `interface`, `enum`

**Examples:**
```bash
/generate service user-data
/generate pipe currency-format
/generate guard auth
```

### 🤖 AI Agent Specific

#### `/ai-agent <action> [options]`
Project-specific commands for AI features and development workflow.

**Actions:**
- `serve` - Start development server
- `build` - Build for production
- `new-ai-feature <name>` - Create AI-powered feature
- `add-model <name>` - Add AI model support
- `create-modal <name>` - Create Material modal
- `create-page <name>` - Create page with routing

**Examples:**
```bash
/ai-agent serve
/ai-agent new-ai-feature video-generation
/ai-agent create-modal settings
```

## File Structure Generated

```
projects/ai-agent/src/app/components/<component>/
├── <component>.ts           # Component class
├── <component>.html         # Template
├── <component>.scss         # Styles
├── <component>.service.ts   # Service (optional)
├── <component>.spec.ts      # Tests (optional)
└── README.md               # Documentation (optional)
```

## Patterns Applied

- ✅ **Standalone Components** - No NgModules
- ✅ **Angular Signals** - Reactive state management
- ✅ **Material Design 3** - Consistent UI patterns
- ✅ **TypeScript Strict** - Full type safety
- ✅ **Service Integration** - AI service patterns
- ✅ **Responsive Design** - Mobile-first approach
- ✅ **Performance** - Lazy loading and OnPush
- ✅ **Accessibility** - ARIA and keyboard navigation

## Usage in Claude Code

1. Open Claude Code in this project directory
2. Use any command with `/` prefix
3. Follow the prompts and options
4. Generated code follows all project patterns
5. Files are automatically created with proper structure

## Integration

Commands automatically handle:
- File creation and directory structure
- Import statements and dependencies
- Routing updates (for pages)
- Navigation menu updates
- Service registration
- TypeScript configuration compliance

## Customization

Edit any command file to modify templates, patterns, or add new functionality specific to your project needs.

## Dependencies

Commands assume the following project setup:
- Angular 20+ with standalone components
- Material Design components
- Signal-based reactive programming
- TypeScript strict mode
- Project structure under `projects/ai-agent/`

Start with `/ui-component` for most component needs, or use `/ai-agent new-ai-feature` for AI-powered features.