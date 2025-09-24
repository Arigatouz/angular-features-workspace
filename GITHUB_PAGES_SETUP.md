# GitHub Pages Setup Instructions

After changing repository visibility from private to public, GitHub Pages needs to be reconfigured.

## Steps to Fix GitHub Pages:

### 1. Enable GitHub Pages
1. Go to your repository on GitHub
2. Click on **Settings** tab
3. Scroll down to **Pages** section in the left sidebar
4. Under **Source**, select **GitHub Actions**
5. Save the settings

### 2. Verify Workflow Permissions
1. In your repository, go to **Settings** → **Actions** → **General**
2. Under **Workflow permissions**, ensure:
   - **Read and write permissions** is selected
   - **Allow GitHub Actions to create and approve pull requests** is checked

### 3. Trigger Deployment
1. Go to **Actions** tab in your repository
2. Find the "Deploy Angular AI Agent to GitHub Pages" workflow
3. Click **Run workflow** → **Run workflow** button
4. Or simply push a commit to trigger automatic deployment

### 4. Expected URL
Your site should be available at:
`https://[your-username].github.io/[repository-name]/`

## Common Issues:

- **404 Error**: Make sure Pages is set to "GitHub Actions" source
- **Permission Error**: Check workflow permissions in Settings → Actions
- **Build Fails**: Ensure all dependencies are properly committed

## Workflow Features:
✅ Automatic deployment on push to main/master
✅ Manual workflow dispatch
✅ SPA routing support (404.html)
✅ Production build optimization
✅ Base href configuration for GitHub Pages