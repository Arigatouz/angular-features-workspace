# 🤖 Angular AI Agent - Intelligent Conversation Assistant

[![Deploy to GitHub Pages](https://github.com/your-username/angular-features-workspace/actions/workflows/deploy-github-pages.yml/badge.svg)](https://github.com/your-username/angular-features-workspace/actions/workflows/deploy-github-pages.yml)
[![CI](https://github.com/your-username/angular-features-workspace/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/angular-features-workspace/actions/workflows/ci.yml)

A modern, feature-rich AI conversation assistant built with Angular 20+ and Google's Generative AI. Features secure user API key management, persistent conversation storage, and a beautiful Material Design interface.

## ✨ Features

### 🔐 Secure API Key Management
- **User-provided API keys** - No hardcoded secrets
- **Real-time validation** with Google AI API
- **Secure storage** using sessionStorage
- **Visual status indicators** with management controls

### 💬 Advanced Conversation Interface
- **Modern chat UI** with message bubbles and typing indicators
- **Conversation management** - rename, delete, export individual chats
- **Message editing** - modify user messages with inline editing
- **Rich markdown rendering** - formatted AI responses with syntax highlighting

### 🗄️ Enterprise-Grade Data Storage
- **IndexedDB integration** using Dexie.js for scalable local storage
- **Automatic migration** from localStorage to IndexedDB
- **Export/Import functionality** - backup and restore conversations
- **Database statistics** - live conversation and message counts

### 🎨 Professional UI/UX
- **Material Design 3** - Modern, accessible interface
- **Responsive design** - Works on desktop, tablet, and mobile
- **Conversation sidebar** - Easy navigation between chats
- **Clean, modern styling** with professional color scheme

### ⚡ Modern Angular Architecture
- **Angular 20+** with standalone components and signals
- **Reactive programming** using effects and computed signals
- **TypeScript** with strict type safety
- **Modern build tools** and optimization

## 🚀 Live Demo

**Deployed Version**: [View Live Application](https://your-username.github.io/angular-features-workspace/)

> **Note**: You'll need a Google AI API key to use the assistant. The app will guide you through obtaining one.

## 🛠️ Quick Start

### Prerequisites
- **Node.js 20+**
- **Google AI API Key** (get yours at [Google AI Studio](https://makersuite.google.com/app/apikey))

### Local Development

```bash
# Clone the repository
git clone https://github.com/your-username/angular-features-workspace.git
cd angular-features-workspace

# Install dependencies
npm install

# Start development server
npm start

# Open http://localhost:4200
```

### API Key Setup

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. The app will prompt you to enter it on first visit
4. Key is stored locally and validated in real-time

## 📦 Available Commands

### Development
```bash
npm start                    # Start development server (port 4200)
npm run watch               # Build with file watching
```

### Production Builds
```bash
npm run build               # Standard production build
npm run build:prod          # Explicit production build
npm run build:github-pages  # Build for GitHub Pages deployment
```

### Deployment
```bash
npm run deploy:github-pages  # Prepare for GitHub Pages deployment
npm run preview:github-pages # Local preview of deployed version
```

### Testing
```bash
npm test                    # Run unit tests
# npm run e2e                # Run end-to-end tests (coming soon)
```

## 🚀 Deployment

### Automatic GitHub Pages Deployment

This project includes automated deployment pipelines:

#### 📋 Setup Steps
1. **Fork/clone** this repository
2. **Enable GitHub Pages** in repository settings
3. **Push to main branch** - deployment starts automatically
4. **Access your app** at `https://your-username.github.io/repository-name/`

#### 🔄 Deployment Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **deploy-github-pages.yml** | Push to main/master | Production deployment to GitHub Pages |
| **pr-preview.yml** | Pull requests | Build validation and preview |
| **ci.yml** | Push to develop/feature branches | Continuous integration testing |

#### 📊 Pipeline Features
- ✅ **Automated builds** with production optimization
- ✅ **SPA routing support** for GitHub Pages
- ✅ **Build size analysis** and reporting
- ✅ **Multi-node testing** (Node.js 18, 20)
- ✅ **Bundle optimization** with tree shaking

### Manual Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions and troubleshooting.

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Angular 20+ with Material Design
- **AI Integration**: Google Generative AI (@google/genai)
- **Database**: Dexie.js (IndexedDB wrapper)
- **Styling**: SCSS with Material Design 3
- **Build Tools**: Angular CLI with Vite
- **Deployment**: GitHub Actions + GitHub Pages

### Project Structure
```
src/
├── app/
│   ├── components/
│   │   ├── api-key-modal/          # API key management modal
│   │   └── text-generation/        # Main chat interface
│   ├── services/
│   │   ├── api-key.service.ts      # API key management
│   │   ├── conversation.service.ts  # Chat management
│   │   ├── database.service.ts     # IndexedDB operations
│   │   └── google-gen-ai.ts        # AI service integration
│   ├── pipes/
│   │   └── markdown.pipe.ts        # Markdown rendering
│   └── environments/               # Environment configurations
├── .github/
│   └── workflows/                  # CI/CD pipeline definitions
└── dist/                          # Built application (auto-generated)
```

## 🔧 Configuration

### Environment Variables
- **Development**: `src/environments/environment.ts`
- **Production**: `src/environments/environment.prod.ts`

> **Security Note**: API keys are never stored in environment files. Users provide their own keys through the secure modal interface.

### Build Configuration
- **Angular CLI**: Standard Angular build configuration
- **GitHub Pages**: Automatic base href configuration
- **Bundle Size**: Optimized with tree shaking and minification

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow Angular style guide
- Write tests for new features
- Update documentation for API changes
- Ensure builds pass CI pipeline

## 🐛 Troubleshooting

### Common Issues

#### API Key Problems
- Ensure your Google AI API key is valid and has proper permissions
- Check that billing is enabled for your Google Cloud project
- Verify API quotas haven't been exceeded

#### Build Issues
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version compatibility (20+ recommended)

#### Deployment Issues
- Verify GitHub Pages is enabled in repository settings
- Check GitHub Actions workflow permissions
- Review deployment logs in Actions tab

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed troubleshooting guide.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Angular Team** - For the amazing framework
- **Google AI Team** - For the Generative AI APIs
- **Material Design** - For the beautiful UI components
- **Dexie.js** - For the excellent IndexedDB wrapper
- **GitHub** - For free hosting and CI/CD pipelines

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/angular-features-workspace/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/angular-features-workspace/discussions)
- **Documentation**: [Deployment Guide](./DEPLOYMENT.md)

---

**Made with ❤️ using Angular and Google AI**

**🌟 Star this repo if you find it helpful!**