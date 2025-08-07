# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-08-07

### Added
- Initial release of Claude Code Remote Installer
- SSH agent authentication support (like regular ssh command)
- SSH key file authentication with `-k` option
- Password authentication as fallback
- Automatic Node.js and npm installation
- Global installation of Claude Code and Claude Code Router
- Config.json copying to remote server
- Installation verification for both tools
- Cross-platform support (Ubuntu, CentOS, Amazon Linux)
- Comprehensive error handling and logging
- Bilingual README (English/Chinese)
- GitHub workflows and templates
- MIT License

### Fixed
- SSH authentication issues with proper agent support
- Path resolution for config file copying
- Command verification using correct `ccr -v` instead of `claude-code-router --version`

### Security
- Added SSH key passphrase support
- Secure password prompting
- Proper file permission handling