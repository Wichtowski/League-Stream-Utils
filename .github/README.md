# GitHub Workflows

This directory contains GitHub Actions workflows for automated building and deployment.

## Workflows

### 1. Electron Package Build (`electron-package.yml`)

Builds and packages the Electron application for Windows, macOS, and Linux.

**Triggers:**
- Push to `main` branch
- Manual workflow dispatch

**Features:**
- Multi-platform builds (Windows, macOS, Ubuntu)
- Creates GitHub releases with versioned tags
- Uploads build artifacts
- Uses Bun for faster builds

**Outputs:**
- Platform-specific executables in `app/dist/`
- GitHub release with Windows executable
- Build artifacts for all platforms

### 2. Vercel Deployment (`deploy-vercel.yml`)

Deploys the Next.js web application to Vercel.

**Triggers:**
- Push to `main` branch
- Manual workflow dispatch

**Features:**
- Builds Next.js application
- Deploys to Vercel production environment
- Uses Bun for faster builds

## Required Secrets

### For Electron Package Workflow
- `GITHUB_TOKEN` - Automatically provided by GitHub

### For Vercel Deployment Workflow
- `VERCEL_TOKEN` - Your Vercel API token
- `VERCEL_ORG_ID` - Your Vercel organization ID
- `VERCEL_PROJECT_ID` - Your Vercel project ID

## Setup Instructions

### 1. Vercel Setup

1. Create a Vercel account and project
2. Get your Vercel API token from [Vercel Dashboard > Settings > Tokens](https://vercel.com/account/tokens)
3. Get your organization ID and project ID from your Vercel project settings

### 2. GitHub Secrets Setup

1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Add the following repository secrets:
   - `VERCEL_TOKEN`: Your Vercel API token
   - `VERCEL_ORG_ID`: Your Vercel organization ID
   - `VERCEL_PROJECT_ID`: Your Vercel project ID

### 3. Vercel Project Configuration

Make sure your Vercel project is configured to:
- Use the `app` directory as the root
- Build command: `bun run build`
- Output directory: `.next`
- Install command: `npm ci`

## Usage

### Automatic Deployment
- Push to the `main` branch to trigger both workflows automatically

### Manual Deployment
- Go to Actions tab in GitHub
- Select the workflow you want to run
- Click "Run workflow"

## Notes

- The Electron workflow creates releases with version numbers based on the GitHub run number
- Both workflows use Bun for faster package installation and builds
- Build artifacts are retained for 30 days
- The Vercel deployment uses the production environment (`--prod` flag) 