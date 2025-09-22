# 🚀 Deployment Guide - Angular AI Agent

This guide explains how to deploy your Angular AI Agent application to GitHub Pages using automated pipelines.

## 📋 Prerequisites

- GitHub repository with your Angular application
- GitHub Pages enabled in repository settings
- Node.js 20+ for local development

## 🔧 GitHub Pages Setup

### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. Save the settings

### 2. Repository Permissions

Ensure your repository has the correct workflow permissions:

1. Go to **Settings** → **Actions** → **General**
2. Under **Workflow permissions**, select **Read and write permissions**
3. Check **Allow GitHub Actions to create and approve pull requests**
4. Save changes

## 🚀 Automated Deployment

### Main Deployment Pipeline

**File**: `.github/workflows/deploy-github-pages.yml`

**Triggers**:
- Push to `main` or `master` branch
- Manual trigger via GitHub Actions tab

**Process**:
1. **Build**: Compiles Angular app with production configuration
2. **Optimize**: Sets proper base href for GitHub Pages
3. **SPA Setup**: Configures routing for single-page application
4. **Deploy**: Uploads to GitHub Pages

### PR Preview Pipeline

**File**: `.github/workflows/pr-preview.yml`

**Triggers**:
- Pull request opened/updated

**Process**:
1. **Validate**: Runs linting and tests
2. **Build**: Creates production build
3. **Analyze**: Reports build size and status

## 🛠️ Available NPM Scripts

```bash
# Development
npm start                    # Start development server
npm run watch               # Build with file watching

# Production Builds
npm run build               # Standard production build
npm run build:prod          # Explicit production build
npm run build:github-pages  # Build optimized for GitHub Pages

# Deployment
npm run deploy:github-pages  # Full deployment preparation
npm run preview:github-pages # Local preview of GitHub Pages build
```

## 📁 Build Configuration

### Environment Files

- **Development**: `src/environments/environment.ts`
- **Production**: `src/environments/environment.prod.ts`

Both files have empty `GOOGLE_API_KEY` - users provide keys through the modal.

### GitHub Pages Optimizations

1. **Base Href**: Automatically set to `/repository-name/`
2. **SPA Routing**: `404.html` redirects to `index.html`
3. **Jekyll Bypass**: `.nojekyll` file prevents Jekyll processing
4. **Asset Optimization**: Production build with minification

## 🌐 Accessing Your Deployed App

Once deployed, your app will be available at:
```
https://[username].github.io/[repository-name]/
```

Example: `https://yourusername.github.io/angular-features-workspace/`

## 🔍 Monitoring Deployments

### GitHub Actions Tab
- View deployment status and logs
- Monitor build times and success rates
- Access deployment URLs

### Deployment Status
- **✅ Green**: Successful deployment
- **🟡 Yellow**: In progress
- **❌ Red**: Failed - check logs

## 🚨 Troubleshooting

### Common Issues

#### 1. Deployment Failed
```bash
# Check workflow logs in GitHub Actions tab
# Look for specific error messages
```

#### 2. 404 Errors on Routes
- Ensure `.nojekyll` file exists
- Verify `404.html` is copied from `index.html`
- Check base href configuration

#### 3. Build Size Warnings
- Monitor bundle size in workflow logs
- Consider code splitting if needed
- Review dependency usage

#### 4. Environment Variables
- API keys are provided by users (not in environment)
- No server-side secrets needed
- All configuration is client-side

### Manual Debugging

#### Local GitHub Pages Preview
```bash
# Build and preview locally
npm run preview:github-pages

# Access at http://localhost:8080
```

#### Build Analysis
```bash
# Check build output
npm run build:prod
ls -la dist/ai-agent/browser/

# Verify file sizes
du -sh dist/ai-agent/browser/*
```

## 📊 Performance Optimization

### Automatic Optimizations
- **Tree Shaking**: Removes unused code
- **Minification**: Reduces bundle size
- **Compression**: Gzip compression enabled
- **Caching**: NPM dependencies cached in CI

### Manual Optimizations
- **Lazy Loading**: Routes loaded on demand
- **Service Workers**: Can be added for caching
- **CDN**: GitHub Pages includes CDN

## 🔐 Security Considerations

- **API Keys**: User-provided, stored in sessionStorage
- **HTTPS**: Automatically enabled on GitHub Pages
- **Content Security**: DomSanitizer used for markdown
- **Dependencies**: Regular security updates via Dependabot

## 🎯 Next Steps

1. **Push to main branch** to trigger first deployment
2. **Monitor GitHub Actions** for deployment status
3. **Test deployed app** with real API keys
4. **Set up branch protection** for main branch (optional)
5. **Configure Dependabot** for security updates (optional)

## 📝 Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Angular Deployment Guide](https://angular.dev/tools/cli/deployment)

---

## 🎉 Success Checklist

- [ ] GitHub Pages enabled in repository settings
- [ ] Workflow files committed to `.github/workflows/`
- [ ] First deployment completed successfully
- [ ] Application accessible via GitHub Pages URL
- [ ] API key modal appears on first visit
- [ ] All features working in deployed version

**Your Angular AI Agent is now ready for the world! 🌍✨**