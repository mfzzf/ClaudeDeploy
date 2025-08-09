# ClaudeDeploy 🚀

<div align="center">

[![npm version](https://badge.fury.io/js/claudedeploy.svg)](https://badge.fury.io/js/claudedeploy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)

**通用Claude Code安装器 - 支持本地计算机和远程服务器**

[中文文档](README_CN.md) | [English](README.md)

</div>

## ✨ 功能特点

- 🎨 **Web UI实时日志** - 美观的界面，实时命令输出流
- 🖥️ **本地安装** - 在Windows/macOS/Linux上直接安装Claude Code
- 🔐 **远程安装** - 通过SSH零配置认证连接到任何服务器
- 📦 **自动依赖** - 如果缺少Node.js/npm则自动安装
- 🚀 **一键设置** - 全局安装Claude Code和Claude Code Router
- ⚙️ **配置迁移** - 可选的远程服务器配置文件复制
- ✅ **安装验证** - 验证两个工具是否正确安装
- 🎯 **通用支持** - 支持任何有Node.js的平台
- 🌐 **自动打开浏览器** - UI自动在默认浏览器中打开
- 📊 **WebSocket实时更新** - 实时查看每个命令及其输出

## 🚀 快速开始

### 安装
```bash
# 通过npm全局安装
npm install -g claudedeploy

# 或者本地安装
git clone https://github.com/mfzzf/claudedeploy.git
cd claudedeploy
npm install
npm link
```

### 使用示例

#### 🎨 Web UI（推荐）
```bash
# 启动交互式Web界面
claudedeploy ui

# 使用自定义端口
claudedeploy ui --port 3000

# 在浏览器中访问UI
# 默认: http://localhost:3456
```

**Web UI 功能：**
- 📊 **可视化界面** - 现代化响应式设计，直观导航
- 🔧 **简单配置** - 表单输入带验证和帮助提示
- 📜 **安装历史** - 跟踪所有安装的状态、持续时间和日志
- 💻 **实时控制台** - 通过WebSocket实时流式传输命令输出
- 🌐 **自动打开浏览器** - UI自动在默认浏览器中打开
- 🔄 **WebSocket连接** - 双向通信，即时更新
- 🎨 **美观设计** - 大字体、渐变背景、流畅动画
- 📡 **实时命令日志** - 查看每个npm安装、版本检查和验证
- ⏱️ **时间戳条目** - 每个日志显示确切执行时间
- 🔴 **颜色编码输出** - 绿色表示成功，红色表示错误，黄色表示警告

#### 🖥️ 本地安装（您的计算机）
```bash
# 在本地计算机上安装Claude Code
claudedeploy --local

# 使用OpenAI配置生成安装
claudedeploy --local --openai-key YOUR_API_KEY

# 使用自定义OpenAI兼容URL安装
claudedeploy --local --openai-key YOUR_API_KEY --openai-url https://your-api-domain.com

# 使用中国npm源安装
claudedeploy --local --registry https://registry.npmmirror.com

# 支持Windows、macOS和Linux
```

#### 🔐 远程安装（SSH服务器）
```bash
# 在远程Ubuntu/CentOS服务器上安装
claudedeploy -h your-server.com -u username

# 使用SSH密钥认证
claudedeploy -h 192.168.1.100 -u ubuntu -k ~/.ssh/id_rsa

# 使用密码认证
claudedeploy -h example.com -u ubuntu -p yourpassword

# 自定义端口
claudedeploy -h server.com -u ubuntu --port 2222

# 跳过配置文件复制
claudedeploy -h server.com -u ubuntu --skip-config

# 使用中国npm源（淘宝）
claudedeploy -h server.com -u ubuntu --registry https://registry.npmmirror.com
```

#### ⚙️ OpenAI配置生成
```bash
# 使用OpenAI API密钥生成config.json
claudedeploy --generate-config --openai-key YOUR_API_KEY

# 使用自定义OpenAI兼容URL生成
claudedeploy --generate-config --openai-key YOUR_API_KEY --openai-url https://your-api-domain.com
```

## 📋 命令行选项

### Web UI
| 选项 | 描述 | 是否必需 |
|------|------|----------|
| `ui` | 启动基于Web的UI服务器 | ✅ |
| `--port <port>` | UI服务器运行端口（默认：3456） | ❌ |
| `--no-open` | 不自动打开浏览器 | ❌ |

### 本地安装
| 选项 | 描述 | 是否必需 |
|------|------|----------|
| `--verbose` | 启用详细输出 | ❌ |
| `--dry-run` | 仅打印命令不执行 | ❌ |
| `--local` | 在此本地计算机上安装 | ✅ |
| `--openai-key <key>` | OpenAI API密钥用于配置生成 | ❌ |
| `--openai-url <url>` | OpenAI基础URL（默认：https://api.openai.com） | ❌ |
| `--registry <registry>` | npm registry URL（例如：https://registry.npmmirror.com） | ❌ |

### 远程安装
| 选项 | 描述 | 是否必需 |
|------|------|----------|
| `-h, --host <host>` | 远程服务器主机名或IP | ✅ |
| `-u, --username <username>` | SSH用户名 | ✅ |
| `-p, --password <password>` | SSH密码 | ❌ |
| `-k, --key <path>` | SSH私钥文件路径 | ❌ |
| `--passphrase <passphrase>` | SSH密钥密码 | ❌ |
| `--port <port>` | SSH端口（默认22） | ❌ |
| `--skip-config` | 跳过复制config.json（用于远程安装） | ❌ |
| `--registry <registry>` | npm registry URL（例如：https://registry.npmmirror.com） | ❌ |
| `--user-install` | 不使用sudo安装（用户级全局） | ❌ |

### OpenAI配置生成
| 选项 | 描述 | 是否必需 |
|------|------|----------|
| `--generate-config` | 使用API密钥生成OpenAI config.json | ✅ |
| `--openai-key <key>` | OpenAI API密钥用于配置生成 | ✅ |
| `--openai-url <url>` | OpenAI基础URL（默认：https://api.openai.com） | ❌ |

## 🔧 工作原理
### 安全提示

- 避免在命令行参数中明文传递密码。建议使用交互式输入（无回显）或SSH agent。
- 配置文件包含API密钥，生成时权限为600。
- `--registry` 会进行URL校验后再使用。


### 本地安装：
1. **检查** 您计算机上的Node.js安装
2. **安装** Claude Code全局：`npm install -g @anthropic-ai/claude-code`
3. **安装** Claude Code Router全局：`npm install -g @musistudio/claude-code-router`
4. **验证** 两个工具是否在本地正常工作

### 远程安装：
1. **连接** 通过SSH连接到您的远程服务器
2. **检查** Node.js和npm安装
3. **安装** 如果需要则安装Node.js和npm
4. **安装** Claude Code和Claude Code Router全局
5. **复制** 您的本地config.json到远程服务器（可选）
6. **验证** 两个工具是否正常工作

### OpenAI配置生成：
1. **获取** 从`/v1/models`端点获取可用模型
2. **过滤** 聊天模型（GPT模型）
3. **生成** 使用您的API密钥优化的config.json
4. **自动包含** 所有可用的OpenAI模型

## 🖥️ 支持平台

### 本地安装：
- Windows 10/11
- macOS 10.15+
- Ubuntu 18.04+
- CentOS 7+
- 任何有Node.js 16+的系统

### 远程安装：
- Ubuntu/Debian
- CentOS/RHEL
- Amazon Linux
- 任何有apt/yum的Linux发行版

## 🛠️ 要求

### 本地安装：
- Node.js 16.0.0或更高版本
- npm（随Node.js提供）

### 远程安装：
- Node.js 16.0.0或更高版本
- 远程服务器的SSH访问权限
- 远程服务器的sudo权限

## 📊 示例输出

### Web UI 控制台：
```bash
🌐 打开浏览器到 http://localhost:3456
✅ ClaudeDeploy UI 运行在: http://localhost:3456
📱 打开浏览器以配置和管理安装

# 浏览器中的实时日志：
[10:23:45] 已连接到ClaudeDeploy服务器
[10:23:46] WebSocket连接已建立，实时日志已启用
[10:23:50] 开始本地安装...
[10:23:50] 检查Node.js安装...
[10:23:51] v20.11.0
[10:23:51] ✅ Node.js已安装
[10:23:51] 检查npm安装...
[10:23:52] 10.2.4
[10:23:52] ✅ npm可用
[10:23:52] 📦 安装 @anthropic-ai/claude-code...
[10:23:58] ✅ Claude Code安装成功
[10:23:58] 📦 安装 @musistudio/claude-code-router...
[10:24:03] ✅ Claude Code Router安装成功
[10:24:03] 🎉 本地安装成功完成！
```

### 本地安装：
```bash
🚀 本地安装Claude Code...
✅ Node.js已安装
✅ 全局安装Claude Code
✅ 全局安装Claude Code Router
✅ 验证Claude Code安装
✅ 验证Claude Code Router安装

✅ Claude Code在您的计算机上成功安装！
🎉 您现在可以在本地使用`claude`和`ccr`命令了。
```

### 远程安装：
```bash
🚀 在远程服务器上安装Claude Code...
✅ 已连接到远程服务器
✅ 检查Node.js安装
✅ 安装npm
✅ 安装Claude Code
✅ 安装Claude Code Router
✅ 配置文件复制成功
✅ 验证Claude Code安装
✅ 验证Claude Code Router安装

✅ Claude Code在远程服务器上成功安装！
🎉 您现在可以在远程服务器上使用Claude Code了。
```

## 🤝 贡献

欢迎贡献！请随时提交Pull Request。

详细请查看 `CONTRIBUTING.md`。本仓库采用轻量 CI：
- CI 仅在 Pull Request 上触发，并且只对 JS/配置/工作流文件进行 Lint。
- 文档类改动可在 PR 标题/描述加入 `[skip ci]` 或添加标签 `skip-ci` 来跳过 CI。

## 📄 许可证

本项目采用MIT许可证 - 详见[LICENSE](LICENSE)文件。

## 🆘 支持

- **问题反馈**: [GitHub Issues](https://github.com/mfzzf/claudedeploy/issues)
- **讨论**: [GitHub Discussions](https://github.com/mfzzf/claudedeploy/discussions)

## 🎯 路线图

- [ ] 支持更多Linux发行版
- [ ] Docker容器支持
- [ ] 配置模板
- [ ] 批量服务器安装
- [ ] 安装日志和报告