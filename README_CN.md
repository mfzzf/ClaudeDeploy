# ClaudeDeploy 🚀

<div align="center">

[![npm version](https://badge.fury.io/js/claudedeploy.svg)](https://badge.fury.io/js/claudedeploy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)

**通用Claude Code安装器 - 支持本地计算机和远程服务器**

[中文文档](README_CN.md) | [English](README.md)

</div>

## ✨ 功能特点

- 🖥️ **本地安装** - 在Windows/macOS/Linux上直接安装Claude Code
- 🔐 **远程安装** - 通过SSH零配置认证连接到任何服务器
- 📦 **自动依赖** - 如果缺少Node.js/npm则自动安装
- 🚀 **一键设置** - 全局安装Claude Code和Claude Code Router
- ⚙️ **配置迁移** - 可选的远程服务器配置文件复制
- ✅ **安装验证** - 验证两个工具是否正确安装
- 🎯 **通用支持** - 支持任何有Node.js的平台

## 🚀 快速开始

### 安装
```bash
# 通过npm全局安装
npm install -g claudedeploy

# 或者本地安装
git clone https://github.com/your-username/claudedeploy.git
cd claudedeploy
npm install
npm link
```

### 使用示例

#### 🖥️ 本地安装（您的计算机）
```bash
# 在本地计算机上安装Claude Code
claudedeploy --local

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
```

## 📋 命令行选项

### 本地安装
| 选项 | 描述 | 是否必需 |
|------|------|----------|
| `--local` | 在此本地计算机上安装 | ✅ |

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

## 🔧 工作原理

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

### UCloud配置生成：
1. **获取** 从`/v1/models`端点获取可用模型
2. **过滤** 聊天模型（排除图像/文本到图像模型）
3. **生成** 使用您的API密钥优化的config.json
4. **自动包含** 所有可用的UCloud模型

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

## 📄 许可证

本项目采用MIT许可证 - 详见[LICENSE](LICENSE)文件。

## 🆘 支持

- **问题反馈**: [GitHub Issues](https://github.com/your-username/claudedeploy/issues)
- **讨论**: [GitHub Discussions](https://github.com/your-username/claudedeploy/discussions)

## 🎯 路线图

- [ ] 支持更多Linux发行版
- [ ] Docker容器支持
- [ ] 配置模板
- [ ] 批量服务器安装
- [ ] 安装日志和报告