# ClaudeDeploy 🚀

<div align="center">

[![npm version](https://badge.fury.io/js/claudedeploy.svg)](https://badge.fury.io/js/claudedeploy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)

**Universal Claude Code installer - works on your computer and remote servers**

[中文文档](README_CN.md) | [English](README.md)

</div>

## ✨ Features

- 🖥️ **Local Installation** - Install Claude Code directly on Windows/macOS/Linux
- 🔐 **Remote Installation** - SSH to any server with zero-config authentication
- 📦 **Auto Dependencies** - Node.js/npm installation if missing
- 🚀 **One-Command Setup** - Install Claude Code and Claude Code Router globally
- ⚙️ **Config Migration** - Optional config copying for remote servers
- ✅ **Installation Verification** - Verify both tools are properly installed
- 🎯 **Universal Support** - Works on any platform with Node.js

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

#### 🖥️ Local Installation (Your Computer)
```bash
# Install Claude Code on your local computer
claudedeploy --local

# Install with UCloud config generation
claudedeploy --local --ucloud-key YOUR_API_KEY

# Install with custom UCloud URL
claudedeploy --local --ucloud-key YOUR_API_KEY --ucloud-url https://your-ucloud-domain.com

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

#### ⚙️ UCloud Config Generation
```bash
# Generate config.json with UCloud API key
claudedeploy --generate-config --ucloud-key YOUR_API_KEY

# Generate with custom UCloud URL
claudedeploy --generate-config --ucloud-key YOUR_API_KEY --ucloud-url https://your-ucloud-domain.com
```

## 📋 Command Line Options

### Local Installation
| Option | Description | Required |
|--------|-------------|----------|
| `--local` | Install on this local computer | ✅ |
| `--ucloud-key <key>` | UCloud API key for config generation | ❌ |
| `--ucloud-url <url>` | UCloud base URL (default: https://deepseek.modelverse.cn) | ❌ |
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

### UCloud Config Generation
| Option | Description | Required |
|--------|-------------|----------|
| `--generate-config` | Generate UCloud config.json with API key | ✅ |
| `--ucloud-key <key>` | UCloud API key for config generation | ✅ |
| `--ucloud-url <url>` | UCloud base URL (default: https://deepseek.modelverse.cn) | ❌ |

## 🔧 What It Does

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

### UCloud Config Generation:
1. **Fetches** available models from `/v1/models` endpoint
2. **Filters** chat models (excludes image/text-to-image models)
3. **Generates** optimized config.json with your API key
4. **Includes** all available UCloud models automatically

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