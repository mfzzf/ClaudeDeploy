# Claude Code Remote Installer 🚀

<div align="center">

[![npm version](https://badge.fury.io/js/claude-code-remote-installer.svg)](https://badge.fury.io/js/claude-code-remote-installer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)

**一键安装 Claude Code 到远程 SSH 服务器 | One-click Claude Code installation on remote SSH servers**

[English](#english) | [中文](#中文)

</div>

---

## English

### ✨ Features

- 🔐 **Multiple SSH Authentication Methods** - SSH agent, key files, and password support
- 📦 **Automatic Dependencies** - Node.js and npm installation if missing
- 🚀 **One-Command Setup** - Install Claude Code and Claude Code Router globally
- ⚙️ **Config Migration** - Automatically copy local config.json to remote server
- ✅ **Installation Verification** - Verify both tools are properly installed
- 🎯 **Cross-Platform Support** - Ubuntu, CentOS, Amazon Linux, and more

### 🚀 Quick Start

#### Installation
```bash
# Install globally via npm
npm install -g claude-code-remote-installer

# Or install locally
git clone https://github.com/your-username/claude-code-remote-installer.git
cd claude-code-remote-installer
npm install
npm link
```

#### Usage Examples

```bash
# Use SSH agent (automatic, like ssh command)
claude-remote-install -h your-server.com -u username

# Use specific SSH key
claude-remote-install -h 192.168.1.100 -u ubuntu -k ~/.ssh/id_rsa

# Use password authentication
claude-remote-install -h example.com -u ubuntu -p yourpassword

# Custom port
claude-remote-install -h server.com -u ubuntu --port 2222
```

### 📋 Command Line Options

| Option | Description | Required |
|--------|-------------|----------|
| `-h, --host <host>` | Remote server hostname or IP | ✅ |
| `-u, --username <username>` | SSH username | ✅ |
| `-p, --password <password>` | SSH password | ❌ |
| `-k, --key <path>` | SSH private key file path | ❌ |
| `--passphrase <passphrase>` | SSH key passphrase | ❌ |
| `--port <port>` | SSH port (default: 22) | ❌ |

### 🔧 What It Does

1. **Connects** to your remote server via SSH
2. **Checks** Node.js and npm installation
3. **Installs** Node.js and npm if needed
4. **Installs** Claude Code globally: `npm install -g @anthropic-ai/claude-code`
5. **Installs** Claude Code Router globally: `npm install -g @musistudio/claude-code-router`
6. **Copies** your local `~/.claude-code-router/config.json` to remote server
7. **Verifies** both tools are working correctly

### 🖥️ Supported Platforms

- Ubuntu/Debian
- CentOS/RHEL
- Amazon Linux
- Any Linux distribution with apt/yum

### 🛠️ Requirements

- Node.js 14.0.0 or higher
- SSH access to remote server
- sudo privileges on remote server

### 📊 Example Output

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

---

## 中文

### ✨ 功能特点

- 🔐 **多种SSH认证方式** - 支持SSH代理、密钥文件和密码认证
- 📦 **自动依赖安装** - 自动检测并安装Node.js和npm
- 🚀 **一键安装** - 同时安装Claude Code和Claude Code Router
- ⚙️ **配置迁移** - 自动复制本地config.json到远程服务器
- ✅ **安装验证** - 验证两个工具是否正确安装
- 🎯 **跨平台支持** - 支持Ubuntu、CentOS、Amazon Linux等

### 🚀 快速开始

#### 安装
```bash
# 通过npm全局安装
npm install -g claude-code-remote-installer

# 或者本地安装
git clone https://github.com/your-username/claude-code-remote-installer.git
cd claude-code-remote-installer
npm install
npm link
```

#### 使用示例

```bash
# 使用SSH代理（自动，类似ssh命令）
claude-remote-install -h your-server.com -u username

# 使用指定SSH密钥
claude-remote-install -h 192.168.1.100 -u ubuntu -k ~/.ssh/id_rsa

# 使用密码认证
claude-remote-install -h example.com -u ubuntu -p yourpassword

# 自定义端口
claude-remote-install -h server.com -u ubuntu --port 2222
```

### 📋 命令行选项

| 选项 | 描述 | 是否必需 |
|------|------|----------|
| `-h, --host <host>` | 远程服务器主机名或IP地址 | ✅ |
| `-u, --username <username>` | SSH用户名 | ✅ |
| `-p, --password <password>` | SSH密码 | ❌ |
| `-k, --key <path>` | SSH私钥文件路径 | ❌ |
| `--passphrase <passphrase>` | SSH密钥密码 | ❌ |
| `--port <port>` | SSH端口（默认22） | ❌ |

### 🔧 工作原理

1. **连接** 远程服务器通过SSH
2. **检查** Node.js和npm安装状态
3. **安装** Node.js和npm（如需要）
4. **安装** Claude Code全局: `npm install -g @anthropic-ai/claude-code`
5. **安装** Claude Code Router全局: `npm install -g @musistudio/claude-code-router`
6. **复制** 本地`~/.claude-code-router/config.json`到远程服务器
7. **验证** 两个工具是否正常工作

### 🖥️ 支持平台

- Ubuntu/Debian
- CentOS/RHEL
- Amazon Linux
- 任何支持apt/yum的Linux发行版

### 🛠️ 系统要求

- Node.js 14.0.0或更高版本
- 远程服务器的SSH访问权限
- 远程服务器的sudo权限

### 📊 示例输出

```bash
🚀 开始Claude Code远程安装...

✅ 已连接到远程服务器
✅ 检查Node.js安装
✅ 安装npm
✅ 安装Claude Code
✅ 安装Claude Code Router
✅ 配置文件复制成功
✅ 验证Claude Code安装
✅ 验证Claude Code Router安装

✅ Claude Code安装完成！
您现在可以在远程服务器上使用Claude Code了。
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

欢迎贡献！请随时提交Pull Request。

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

本项目采用MIT许可证 - 详见[LICENSE](LICENSE)文件。

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/claude-code-remote-installer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/claude-code-remote-installer/discussions)

## 🎯 Roadmap

- [ ] Support for more Linux distributions
- [ ] Docker container support
- [ ] Configuration templates
- [ ] Batch server installation
- [ ] Installation logs and reports