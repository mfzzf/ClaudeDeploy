'use strict';

const { Client } = require('ssh2');
const chalk = require('chalk');
const ora = require('ora');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { validateRegistryUrl, filterChatModels } = require('./utils');
const { fetchUCloudModels } = require('./services/ucloud');

class ClaudeRemoteInstaller {
  constructor() {
    this.conn = new Client();
    this.spinner = null;
    this.verbose = false;
    this.dryRun = false;
  }

  async connect(host, username, auth, port = 22) {
    return new Promise((resolve, reject) => {
      this.spinner = ora('Connecting to remote server...').start();
      this.conn.on('ready', () => {
        this.spinner.succeed('Connected to remote server');
        resolve();
      });
      this.conn.on('error', (err) => {
        this.spinner.fail('Connection failed');
        reject(err);
      });
      const connectionConfig = {
        host,
        port,
        username,
        readyTimeout: 30000,
        debug: (msg) => {
          if (msg.includes('auth')) {
            console.log(chalk.gray('SSH Debug:'), msg);
          }
        },
      };
      if (auth.privateKey) {
        connectionConfig.privateKey = auth.privateKey;
        if (auth.passphrase) connectionConfig.passphrase = auth.passphrase;
      } else if (auth.password) {
        connectionConfig.password = auth.password;
      } else if (process.env.SSH_AUTH_SOCK) {
        connectionConfig.agent = process.env.SSH_AUTH_SOCK;
      }
      this.conn.connect(connectionConfig);
    });
  }

  async executeCommand(command, description) {
    if (this.dryRun) {
      console.log(chalk.cyan(`[DRY-RUN][remote] ${command}`));
      return '';
    }
    return new Promise((resolve, reject) => {
      this.spinner = ora(description).start();
      this.conn.exec(command, (err, stream) => {
        if (err) {
          this.spinner.fail(`Failed: ${description}`);
          reject(err);
          return;
        }
        let stdout = '';
        let stderr = '';
        stream.on('close', (code) => {
          if (code === 0) {
            this.spinner.succeed(description);
            resolve(stdout);
          } else {
            this.spinner.fail(`Failed: ${description} (exit code: ${code})`);
            reject(new Error(stderr || `Command failed with exit code ${code}`));
          }
        });
        stream.on('data', (data) => {
          stdout += data.toString();
          if (this.verbose) process.stdout.write(chalk.gray(data.toString()));
        });
        stream.stderr.on('data', (data) => {
          stderr += data.toString();
          if (this.verbose) process.stderr.write(chalk.red(data.toString()));
        });
      });
    });
  }

  async checkNodeInstallation() {
    try {
      await this.executeCommand('node --version', 'Checking Node.js installation');
      return true;
    } catch (error) {
      return false;
    }
  }

  async installNode() {
    const pm = (await this.executeCommand(
      'sh -lc "if command -v apt-get >/dev/null 2>&1; then echo apt; ' +
        'elif command -v dnf >/dev/null 2>&1; then echo dnf; ' +
        'elif command -v yum >/dev/null 2>&1; then echo yum; ' +
        'elif command -v apk >/dev/null 2>&1; then echo apk; ' +
        'elif command -v pacman >/dev/null 2>&1; then echo pacman; ' +
        'else echo unknown; fi"',
      'Detecting package manager'
    )).trim();

    if (pm === 'apt') {
      await this.executeCommand('curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -', 'Adding Node.js repository (deb)');
      await this.executeCommand('sudo apt-get update -y && sudo apt-get install -y nodejs', 'Installing Node.js (deb)');
    } else if (pm === 'dnf' || pm === 'yum') {
      await this.executeCommand('curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -', 'Adding Node.js repository (rpm)');
      const installer = pm === 'dnf' ? 'dnf' : 'yum';
      await this.executeCommand(`sudo ${installer} install -y nodejs`, 'Installing Node.js (rpm)');
    } else if (pm === 'apk') {
      await this.executeCommand('sudo apk add --no-cache nodejs npm', 'Installing Node.js (apk)');
    } else if (pm === 'pacman') {
      await this.executeCommand('sudo pacman -Sy --noconfirm nodejs npm', 'Installing Node.js (pacman)');
    } else {
      try {
        await this.executeCommand('curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -', 'Adding Node.js repository (deb)');
        await this.executeCommand('sudo apt-get update -y && sudo apt-get install -y nodejs', 'Installing Node.js (deb)');
      } catch (_) {
        try {
          await this.executeCommand('curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -', 'Adding Node.js repository (rpm)');
          await this.executeCommand('sudo yum install -y nodejs', 'Installing Node.js (rpm)');
        } catch (e) {
          throw new Error('Failed to install Node.js automatically. Please install Node.js manually.');
        }
      }
    }
  }

  async installNpm() {
    try {
      await this.executeCommand('npm --version', 'Checking npm installation');
    } catch (error) {
      console.log(chalk.yellow('⚠️  npm not detected after Node installation. Please ensure npm is installed.'));
    }
  }

  async installClaudeCode(registry = null, useSudo = true) {
    const validatedRegistry = validateRegistryUrl(registry);
    const baseArgs = ['npm', 'install', '-g'];
    const packages = ['@anthropic-ai/claude-code', '@musistudio/claude-code-router'];
    const registryArgs = validatedRegistry ? ['--registry', validatedRegistry] : [];
    const sudoPrefix = useSudo ? 'sudo ' : '';
    for (const pkgName of packages) {
      const cmd = [sudoPrefix.trim(), ...baseArgs, pkgName, ...registryArgs].filter(Boolean).join(' ');
      await this.executeCommand(cmd, `Installing ${pkgName}`);
    }
  }

  async getRemoteHome(username) {
    try {
      const out = await this.executeCommand(`sh -lc "eval echo ~${username}"`, 'Resolving remote home directory');
      const home = out.trim().split('\n').pop();
      return home && home.startsWith('/') ? home : `/home/${username}`;
    } catch (_) {
      return `/home/${username}`;
    }
  }

  async copyConfigFile(username, skipConfig = false) {
    if (skipConfig) {
      console.log(chalk.blue('ℹ️  Skipping config file copy (local installation mode)'));
      return;
    }
    const localConfigPath = path.join(os.homedir(), '.claude-code-router', 'config.json');
    if (!fs.existsSync(localConfigPath)) {
      console.log(chalk.yellow('⚠️  Local config.json not found, skipping config copy'));
      console.log(chalk.blue('💡 You can configure Claude Code manually after installation'));
      return;
    }
    const configContent = fs.readFileSync(localConfigPath, 'utf8');
    const remoteHome = await this.getRemoteHome(username);
    return new Promise((resolve, reject) => {
      this.spinner = ora('Copying config.json to remote server...').start();
      this.conn.sftp((err, sftp) => {
        if (err) {
          this.spinner.fail('Failed to establish SFTP connection');
          reject(err);
          return;
        }
        const remoteDir = `${remoteHome}/.claude-code-router`;
        const remotePath = `${remoteDir}/config.json`;
        this.conn.exec(`mkdir -p ${remoteDir}`, (err) => {
          if (err) {
            this.spinner.fail('Failed to create remote directory');
            reject(err);
            return;
          }
          const writeStream = sftp.createWriteStream(remotePath, { mode: 0o600 });
          writeStream.on('close', () => {
            this.spinner.succeed('Config file copied successfully');
            resolve();
          });
          writeStream.on('error', (err) => {
            this.spinner.fail('Failed to copy config file');
            reject(err);
          });
          writeStream.write(configContent);
          writeStream.end();
        });
      });
    });
  }

  async generateRemoteUCloudConfig(username, apiKey, baseUrl = 'https://deepseek.modelverse.cn') {
    const remoteHome = await this.getRemoteHome(username);
    const remoteDir = `${remoteHome}/.claude-code-router`;
    const configPath = `${remoteDir}/config.json`;
    this.spinner = ora('Generating UCloud config on remote server...').start();
    try {
      const models = await fetchUCloudModels(baseUrl, apiKey);
      const chatModels = filterChatModels(models);
      const finalModels = chatModels.length > 0 ? chatModels : [
        'Qwen/Qwen3-Coder',
        'moonshotai/Kimi-K2-Instruct',
        'deepseek-ai/DeepSeek-R1-0528',
        'deepseek-ai/DeepSeek-V3-0324',
        'zai-org/glm-4.5',
      ];
      const ucloudConfig = {
        LOG: false,
        CLAUDE_PATH: '',
        HOST: '127.0.0.1',
        PORT: 3456,
        APIKEY: apiKey,
        API_TIMEOUT_MS: '600000',
        PROXY_URL: '',
        Transformers: [],
        Providers: [
          {
            name: 'ucloud',
            api_base_url: `${baseUrl}/v1/chat/completions`,
            api_key: apiKey,
            models: finalModels,
          },
        ],
        Router: {
          default: 'ucloud,moonshotai/Kimi-K2-Instruct',
          background: 'ucloud,moonshotai/Kimi-K2-Instruct',
          think: 'ucloud,moonshotai/Kimi-K2-Instruct',
          longContext: 'ucloud,moonshotai/Kimi-K2-Instruct',
          longContextThreshold: 60000,
          webSearch: 'ucloud,moonshotai/Kimi-K2-Instruct',
        },
      };
      await new Promise((resolve, reject) => {
        this.conn.exec(`mkdir -p ${remoteDir} && chmod 700 ${remoteDir}`, (mkErr) => {
          if (mkErr) return reject(mkErr);
          this.conn.sftp((err, sftp) => {
            if (err) return reject(err);
            const stream = sftp.createWriteStream(configPath, { mode: 0o600 });
            stream.on('error', reject);
            stream.on('close', resolve);
            stream.end(Buffer.from(JSON.stringify(ucloudConfig, null, 2)));
          });
        });
      });
      this.spinner.succeed('UCloud config generated on remote server');
      console.log(chalk.green(`✅ Config file created at: ${configPath}`));
      console.log(chalk.yellow(`📋 Models available: ${finalModels.join(', ')}`));
    } catch (e) {
      this.spinner.fail('Failed to generate remote UCloud config');
      throw e;
    }
  }

  async verifyInstallation() {
    await this.executeCommand('claude --version', 'Verifying Claude Code installation');
    await this.executeCommand('ccr -v', 'Verifying Claude Code Router installation');
  }

  async disconnect() {
    if (this.conn) this.conn.end();
  }

  async installRemote(
    host,
    username,
    auth,
    port,
    skipConfig = false,
    registry = null,
    ucloudKey = null,
    ucloudUrl = 'https://deepseek.modelverse.cn',
    userInstall = false
  ) {
    try {
      console.log(chalk.blue.bold('🚀 Installing Claude Code on remote server...\n'));

      await this.connect(host, username, auth, port);

      const hasNode = await this.checkNodeInstallation();
      if (!hasNode) {
        await this.installNode();
      }

      await this.installNpm();
      await this.installClaudeCode(registry, !userInstall);

      if (ucloudKey) {
        console.log(chalk.blue('🔧 Using provided UCloud API key for config generation...'));
        await this.generateRemoteUCloudConfig(username, ucloudKey, ucloudUrl);
      } else if (!skipConfig) {
        await this.copyConfigFile(username, skipConfig);
      }

      await this.verifyInstallation();

      console.log(chalk.green.bold('\n✅ Claude Code installed successfully on remote server!'));
      console.log(chalk.cyan('🎉 You can now use Claude Code on your remote server.'));
      console.log(
        chalk.blue('\nℹ️  Tip: You can configure default models via `ccr ui` or by editing ~/.claude-code-router/config.json')
      );
    } catch (error) {
      console.error(chalk.red.bold('\n❌ Remote installation failed:'), error.message);
      process.exit(1);
    } finally {
      await this.disconnect();
    }
  }
}

module.exports = { ClaudeRemoteInstaller };

