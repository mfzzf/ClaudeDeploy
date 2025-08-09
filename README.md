# ClaudeDeploy 🚀

<div align="center">

[![npm version](https://badge.fury.io/js/claudedeploy.svg)](https://badge.fury.io/js/claudedeploy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)

**Universal Claude Code installer - works on your computer and remote servers**

[中文文档](README_CN.md) | [English](README.md)

</div>

## ✨ Features

- 🎨 **Web UI with Real-time Logging** - Beautiful interface with live command output streaming
- 🖥️ **Local Installation** - Install Claude Code directly on Windows/macOS/Linux
- 🔐 **Remote Installation** - SSH to any server with zero-config authentication
- 📦 **Auto Dependencies** - Node.js/npm installation if missing
- 🚀 **One-Command Setup** - Install Claude Code and Claude Code Router globally
- ⚙️ **Config Migration** - Optional config copying for remote servers
- ✅ **Installation Verification** - Verify both tools are properly installed
- 🎯 **Universal Support** - Works on any platform with Node.js
- 🌐 **Auto-Browser Launch** - UI automatically opens in your default browser
- 📊 **WebSocket Real-time Updates** - See every command and its output as it happens

## 🚀 Quick Start

### Installation
```bash
# Install globally via npm
npm install -g claudedeploy

# Or install locally
git clone https://github.com/mfzzf/claudedeploy.git
cd claudedeploy
npm install
npm link
```

### Usage Examples

#### 🎨 Web UI (Recommended)
```bash
# Start the interactive web interface
claudedeploy ui

# Use custom port
claudedeploy ui --port 3000

# Access the UI in your browser
# Default: http://localhost:3456
```

**Web UI Features:**
- 📊 **Visual Interface** - Modern, responsive design with intuitive navigation
- 🔧 **Easy Configuration** - Form-based inputs with validation and helpful hints
- 📜 **Installation History** - Track all installations with status, duration, and logs
- 💻 **Real-time Console** - Live streaming of command output via WebSocket
- 🌐 **Auto-Browser Launch** - Automatically opens UI in your default browser
- 🔄 **WebSocket Connection** - Bi-directional communication for instant updates
- 🎨 **Beautiful Design** - Large fonts, gradient backgrounds, smooth animations
- 📡 **Live Command Logs** - See every npm install, version check, and verification
- ⏱️ **Timestamped Entries** - Each log shows exact time of execution
- 🔴 **Color-coded Output** - Green for success, red for errors, yellow for warnings

#### 🖥️ Local Installation (Your Computer)
```bash
# Install Claude Code on your local computer
claudedeploy --local

# Install with OpenAI config generation
claudedeploy --local --openai-key YOUR_API_KEY

# Install with custom OpenAI-compatible URL
claudedeploy --local --openai-key YOUR_API_KEY --openai-url https://your-api-domain.com

# Install with Chinese npm registry
claudedeploy --local --registry https://registry.npmmirror.com

# Works on Windows, macOS, and Linux
```

#### 🔐 Remote Installation (SSH Servers)
```bash
# Install on remote Ubuntu/CentOS server
claudedeploy -h your-server.com -u username

# Use SSH key authentication
claudedeploy -h 192.168.1.100 -u ubuntu -k ~/.ssh/id_rsa

# Use password authentication
claudedeploy -h example.com -u ubuntu -p yourpassword

# Custom port
claudedeploy -h server.com -u ubuntu --port 2222

# Skip config copying
claudedeploy -h server.com -u ubuntu --skip-config

# Use Chinese npm registry (Taobao)
claudedeploy -h server.com -u ubuntu --registry https://registry.npmmirror.com
```

#### ⚙️ OpenAI Config Generation
```bash
# Generate config.json with OpenAI API key
claudedeploy --generate-config --openai-key YOUR_API_KEY

# Generate with custom OpenAI-compatible URL
claudedeploy --generate-config --openai-key YOUR_API_KEY --openai-url https://your-api-domain.com
```

### UCloud Config Generation
```bash
# Generate config.json with UCloud API key (defaults to https://api.modelverse.cn)
claudedeploy --generate-config --ucloud-key YOUR_UCLOUD_KEY

# Specify custom UCloud base URL
claudedeploy --generate-config --ucloud-key YOUR_UCLOUD_KEY --ucloud-url https://api.modelverse.cn

# Generate a combined config for OpenAI + UCloud
claudedeploy --generate-config --openai-key OPENAI_KEY --ucloud-key UCLOUD_KEY
```

### Local Installation with Config Generation
```bash
# Local install + generate UCloud config (models fetched from https://api.modelverse.cn)
claudedeploy --local --ucloud-key YOUR_UCLOUD_KEY

# Local install + generate OpenAI config
claudedeploy --local --openai-key YOUR_OPENAI_KEY

# Local install + combined providers
claudedeploy --local --openai-key OPENAI_KEY --ucloud-key UCLOUD_KEY
```

### First-time Setup Tip

If this is your first time installing Claude Code and `ccr code` gets stuck on the Claude login screen, run the following once, then exit and try again:

```bash
# macOS / Linux
ANTHROPIC_AUTH_TOKEN=token claude

# Then exit the `claude` CLI and run:
ccr code
```

## 📋 Command Line Options

### Web UI
| Option | Description | Required |
|--------|-------------|----------|
| `ui` | Start the web-based UI server | ✅ |
| `--port <port>` | Port to run UI server on (default: 3456) | ❌ |
| `--no-open` | Do not automatically open browser | ❌ |

### Local Installation
| Option | Description | Required |
|--------|-------------|----------|
| `--verbose` | Enable verbose output | ❌ |
| `--dry-run` | Print commands without executing them | ❌ |
| `--local` | Install on this local computer | ✅ |
| `--openai-key <key>` | OpenAI API key for config generation | ❌ |
| `--openai-url <url>` | OpenAI base URL (default: https://api.openai.com) | ❌ |
| `--registry <registry>` | npm registry URL (e.g., https://registry.npmmirror.com) | ❌ |

### Remote Installation
| Option | Description | Required |
|--------|-------------|----------|
| `-h, --host <host>` | Remote server hostname or IP | ✅ |
| `-u, --username <username>` | SSH username | ✅ |
| `-p, --password <password>` | SSH password | ❌ |
| `-k, --key <path>` | SSH private key file path | ❌ |
| `--passphrase <passphrase>` | SSH key passphrase | ❌ |
| `--port <port>` | SSH port (default: 22) | ❌ |
| `--skip-config` | Skip copying config.json (for remote installation) | ❌ |
| `--registry <registry>` | npm registry URL (e.g., https://registry.npmmirror.com) | ❌ |
| `--user-install` | Install without sudo (user-level global) | ❌ |

### OpenAI Config Generation
| Option | Description | Required |
|--------|-------------|----------|
| `--generate-config` | Generate OpenAI config.json with API key | ✅ |
| `--openai-key <key>` | OpenAI API key for config generation | ✅ |
| `--openai-url <url>` | OpenAI base URL (default: https://api.openai.com) | ❌ |

## 🔧 What It Does
### Security Notes

- Avoid passing passwords via CLI flags. Use the interactive prompt (input is hidden) or SSH agent.
- Config files contain API keys. They are written with permission 600.
- `--registry` is validated as a URL before use.


### Local Installation:
1. **Checks** Node.js installation on your computer
2. **Installs** Claude Code globally: `npm install -g @anthropic-ai/claude-code`
3. **Installs** Claude Code Router globally: `npm install -g @musistudio/claude-code-router`
4. **Verifies** both tools are working locally

### Remote Installation:
1. **Connects** to your remote server via SSH
2. **Checks** Node.js and npm installation
3. **Installs** Node.js and npm if needed
4. **Installs** Claude Code and Claude Code Router globally
5. **Copies** your local config.json to remote server (optional)
6. **Verifies** both tools are working correctly

### OpenAI Config Generation:
1. **Fetches** available models from `/v1/models` endpoint
2. **Filters** chat models (GPT models)
3. **Generates** optimized config.json with your API key
4. **Includes** all available OpenAI models automatically

## 🖥️ Supported Platforms

### Local Installation:
- Windows 10/11
- macOS 10.15+
- Ubuntu 18.04+
- CentOS 7+
- Any system with Node.js 16+

### Remote Installation:
- Ubuntu/Debian
- CentOS/RHEL
- Amazon Linux
- Any Linux distribution with apt/yum

## 🛠️ Requirements

### Local Installation:
- Node.js 16.0.0 or higher
- npm (comes with Node.js)

### Remote Installation:
- Node.js 16.0.0 or higher
- SSH access to remote server
- sudo privileges on remote server

## 📊 Example Output

### Web UI Console:
```bash
🌐 Opening browser to http://localhost:3456
✅ ClaudeDeploy UI is running at: http://localhost:3456
📱 Open your browser to configure and manage installations

# Real-time logs in browser:
[10:23:45] Connected to ClaudeDeploy server
[10:23:46] WebSocket connection established for real-time logging
[10:23:50] Starting local installation...
[10:23:50] Checking Node.js installation...
[10:23:51] v20.11.0
[10:23:51] ✅ Node.js is already installed
[10:23:51] Checking npm installation...
[10:23:52] 10.2.4
[10:23:52] ✅ npm is available
[10:23:52] 📦 Installing @anthropic-ai/claude-code...
[10:23:58] ✅ Claude Code installed successfully
[10:23:58] 📦 Installing @musistudio/claude-code-router...
[10:24:03] ✅ Claude Code Router installed successfully
[10:24:03] 🎉 Local installation completed successfully!
```

### Local Installation:
```bash
🚀 Installing Claude Code locally...
✅ Node.js is already installed
✅ Installing Claude Code globally
✅ Installing Claude Code Router globally
✅ Verifying Claude Code installation
✅ Verifying Claude Code Router installation

✅ Claude Code installed successfully on your computer!
🎉 You can now use `claude` and `ccr` commands locally.
```

### Remote Installation:
```bash
🚀 Installing Claude Code on remote server...
✅ Connected to remote server
✅ Checking Node.js installation
✅ Installing npm
✅ Installing Claude Code
✅ Installing Claude Code Router
✅ Config file copied successfully
✅ Verifying Claude Code installation
✅ Verifying Claude Code Router installation

✅ Claude Code installed successfully on remote server!
🎉 You can now use Claude Code on your remote server.
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

See `CONTRIBUTING.md` for details. This repo uses a lightweight CI:
- CI runs only on Pull Requests and only lints changed JS/config/workflow files.
- For docs-only changes, add `[skip ci]` in the PR title/description or label `skip-ci` to skip CI.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/mfzzf/claudedeploy/issues)
- **Discussions**: [GitHub Discussions](https://github.com/mfzzf/claudedeploy/discussions)

## 🎯 Roadmap

- [ ] Support for more Linux distributions
- [ ] Docker container support
- [ ] Configuration templates
- [ ] Batch server installation
- [ ] Installation logs and reports