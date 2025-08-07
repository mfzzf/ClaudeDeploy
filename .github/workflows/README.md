# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automated testing, building, and releasing ClaudeDeploy.

## Workflows

### 1. CI Workflow (`ci.yml`)
- **Trigger**: Push to main/develop branches and pull requests
- **Purpose**: Cross-platform testing and build verification
- **Platforms**: Ubuntu, Windows, macOS
- **Node.js versions**: 16, 18, 20

### 2. Release Workflow (`release.yml`)
- **Trigger**: Git tags starting with `v*` (e.g., `v1.0.0`)
- **Purpose**: Build and release cross-platform binaries
- **Platforms**: Windows, macOS, Linux (x86_64 and ARM64)
- **Artifacts**: 6 binary executables for different architectures

## How to Create a Release

### Method 1: Using Git Tags (Recommended)
```bash
# Create and push a new tag
git tag v1.0.0
git push origin v1.0.0
```

### Method 2: Manual Trigger
1. Go to GitHub Actions tab
2. Select "Build and Release" workflow
3. Click "Run workflow"
4. Enter a tag name (e.g., `v1.0.1`)

## Generated Binaries

Each release will include the following binaries:

| Platform | Architecture | Filename |
|----------|--------------|----------|
| Windows | x86_64 | `claudedeploy-windows-x86_64.exe` |
| Windows | ARM64 | `claudedeploy-windows-arm64.exe` |
| macOS | x86_64 | `claudedeploy-macos-x86_64` |
| macOS | ARM64 | `claudedeploy-macos-arm64` |
| Linux | x86_64 | `claudedeploy-linux-x86_64` |
| Linux | ARM64 | `claudedeploy-linux-arm64` |

## Required Secrets

### GitHub Secrets (automatically available)
- `GITHUB_TOKEN` - For creating releases (provided by GitHub)

### NPM Secrets (for npm publishing)
- `NPM_TOKEN` - For publishing to npm registry

To set up NPM_TOKEN:
1. Go to npmjs.com → Profile → Access Tokens
2. Create a new token with "Publish" permissions
3. Add it to GitHub repository secrets as `NPM_TOKEN`

## Security Notes

The `pkg` package has a known moderate severity vulnerability (CVE-2023-XXXX) related to local privilege escalation. However:
- `pkg` is only used as a **dev dependency** for building binaries
- It's not included in the final production binaries
- The vulnerability only affects the build process, not runtime
- We've configured CI to continue on audit failures for this reason

## Local Testing

You can test the build process locally:

```bash
# Install dependencies
npm ci

# Install pkg globally
npm install -g pkg

# Build all binaries
npm run build:all

# Check built binaries
ls -la dist/
```

## Architecture Support

- **Windows**: x86_64, ARM64
- **macOS**: x86_64 (Intel), ARM64 (Apple Silicon)
- **Linux**: x86_64, ARM64

All binaries are built with Node.js 18 runtime embedded, so no Node.js installation is required on target systems.