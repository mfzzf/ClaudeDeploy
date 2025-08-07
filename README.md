# ClaudeDeploy 🚀

<div align="center">

[![npm version](https://badge.fury.io/js/claudedeploy.svg)](https://badge.fury.io/js/claudedeploy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)

**Deploy Claude Code to any server in seconds**

[中文文档](README_CN.md) | [English](README.md)

</div>

## ✨ Features

- 🔐 **Multiple SSH Authentication Methods** - SSH agent, key files, and password support
- 📦 **Automatic Dependencies** - Node.js and npm installation if missing
- 🚀 **One-Command Setup** - Install Claude Code and Claude Code Router globally
- ⚙️ **Config Migration** - Automatically copy local config.json to remote server
- ✅ **Installation Verification** - Verify both tools are properly installed
- 🎯 **Cross-Platform Support** - Ubuntu, CentOS, Amazon Linux, and more

## 🚀 Quick Start

### Installation
```bash
# Install globally via npm
npm install -g claudedeploy

# Or install locally
git clone https://github.com/your-username/claudedeploy.git
cd claudedeploy
npm install
npm link
```

### Usage Examples

```bash
# Use SSH agent (automatic, like ssh command)
claudedeploy -h your-server.com -u username

# Use specific SSH key
claudedeploy -h 192.168.1.100 -u ubuntu -k ~/.ssh/id_rsa

# Use password authentication
claudedeploy -h example.com -u ubuntu -p yourpassword

# Custom port
claudedeploy -h server.com -u ubuntu --port 2222

# Legacy command (still supported)
claude-remote-install -h server.com -u ubuntu
```

## 📋 Command Line Options

| Option | Description | Required |
|--------|-------------|----------|
| `-h, --host <host>` | Remote server hostname or IP | ✅ |
| `-u, --username <username>` | SSH username | ✅ |
| `-p, --password <password>` | SSH password | ❌ |
| `-k, --key <path>` | SSH private key file path | ❌ |
| `--passphrase <passphrase>` | SSH key passphrase | ❌ |
| `--port <port>` | SSH port (default: 22) | ❌ |

## 🔧 What It Does

1. **Connects** to your remote server via SSH
2. **Checks** Node.js and npm installation
3. **Installs** Node.js and npm if needed
4. **Installs** Claude Code globally: `npm install -g @anthropic-ai/claude-code`
5. **Installs** Claude Code Router globally: `npm install -g @musistudio/claude-code-router`
6. **Copies** your local `~/.claude-code-router/config.json` to remote server
7. **Verifies** both tools are working correctly

## 🖥️ Supported Platforms

- Ubuntu/Debian
- CentOS/RHEL
- Amazon Linux
- Any Linux distribution with apt/yum

## 🛠️ Requirements

- Node.js 16.0.0 or higher
- SSH access to remote server
- sudo privileges on remote server

## 📊 Example Output

```bash
🚀 Starting Claude Code remote installation...

✅ Connected to remote server
✅ Checking Node.js installation
✅ Installing npm
✅ Installing Claude Code
✅ Installing Claude Code Router
✅ Config file copied successfully
✅ Verifying Claude Code installation
✅ Verifying Claude Code Router installation

✅ Claude Code installation completed successfully!
You can now use Claude Code on your remote server.
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/claudedeploy/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/claudedeploy/discussions)

## 🎯 Roadmap

- [ ] Support for more Linux distributions
- [ ] Docker container support
- [ ] Configuration templates
- [ ] Batch server installation
- [ ] Installation logs and reports