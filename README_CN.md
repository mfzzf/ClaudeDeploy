# ClaudeDeploy 🚀

<div align="center">

[![npm version](https://badge.fury.io/js/claudedeploy.svg)](https://badge.fury.io/js/claudedeploy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)

**一键部署Claude Code到任意服务器**

[中文文档](README_CN.md) | [English](README.md)

</div>

## ✨ 功能特点

- 🔐 **多种SSH认证方式** - 支持SSH代理、密钥文件和密码认证
- 📦 **自动依赖安装** - 自动检测并安装Node.js和npm
- 🚀 **一键安装** - 同时安装Claude Code和Claude Code Router
- ⚙️ **配置迁移** - 自动复制本地config.json到远程服务器
- ✅ **安装验证** - 验证两个工具是否正确安装
- 🎯 **跨平台支持** - 支持Ubuntu、CentOS、Amazon Linux等

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

```bash
# 使用SSH代理（自动，类似ssh命令）
claudedeploy -h your-server.com -u username

# 使用指定SSH密钥
claudedeploy -h 192.168.1.100 -u ubuntu -k ~/.ssh/id_rsa

# 使用密码认证
claudedeploy -h example.com -u ubuntu -p yourpassword

# 自定义端口
claudedeploy -h server.com -u ubuntu --port 2222

# 旧命令（仍然支持）
claude-remote-install -h server.com -u ubuntu
```

## 📋 命令行选项

| 选项 | 描述 | 是否必需 |
|------|------|----------|
| `-h, --host <host>` | 远程服务器主机名或IP地址 | ✅ |
| `-u, --username <username>` | SSH用户名 | ✅ |
| `-p, --password <password>` | SSH密码 | ❌ |
| `-k, --key <path>` | SSH私钥文件路径 | ❌ |
| `--passphrase <passphrase>` | SSH密钥密码 | ❌ |
| `--port <port>` | SSH端口（默认22） | ❌ |

## 🔧 工作原理

1. **连接** 远程服务器通过SSH
2. **检查** Node.js和npm安装状态
3. **安装** Node.js和npm（如需要）
4. **安装** Claude Code全局: `npm install -g @anthropic-ai/claude-code`
5. **安装** Claude Code Router全局: `npm install -g @musistudio/claude-code-router`
6. **复制** 本地`~/.claude-code-router/config.json`到远程服务器
7. **验证** 两个工具是否正常工作

## 🖥️ 支持平台

- Ubuntu/Debian
- CentOS/RHEL
- Amazon Linux
- 任何支持apt/yum的Linux发行版

## 🛠️ 系统要求

- Node.js 16.0.0或更高版本
- 远程服务器的SSH访问权限
- 远程服务器的sudo权限

## 📊 示例输出

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