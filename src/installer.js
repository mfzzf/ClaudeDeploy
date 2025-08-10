'use strict';

const { Client } = require('ssh2');
const chalk = require('chalk');
const ora = require('ora');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { validateRegistryUrl, filterChatModels } = require('./utils');
const { fetchOpenAIModels } = require('./services/openai');

class ClaudeRemoteInstaller {
  constructor(options = {}) {
    this.conn = new Client();
    this.spinner = null;
    this.verbose = false;
    this.dryRun = false;
    this.logger = typeof options.logger === 'function' ? options.logger : () => {};
    this.exitOnFailure = options.exitOnFailure !== undefined ? !!options.exitOnFailure : true;
  }

  async connect(host, username, auth, port = 22) {
    return new Promise((resolve, reject) => {
      this.spinner = ora('Connecting to remote server...').start();
      this.conn.on('ready', () => {
        this.spinner.succeed('Connected to remote server');
        this.logger('success', '✅ Connected to remote server');
        resolve();
      });
      this.conn.on('error', (err) => {
        this.spinner.fail('Connection failed');
        this.logger('error', `❌ Connection failed: ${err.message}`);
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
      this.logger('info', `[DRY-RUN][remote] ${command}`);
      return '';
    }
    return new Promise((resolve, reject) => {
      this.spinner = ora(description).start();
      this.conn.exec(command, (err, stream) => {
        if (err) {
          this.spinner.fail(`Failed: ${description}`);
          this.logger('error', `❌ Failed: ${description}: ${err.message}`);
          reject(err);
          return;
        }
        let stdout = '';
        let stderr = '';
        stream.on('close', (code) => {
          if (code === 0) {
            this.spinner.succeed(description);
            this.logger('success', `✅ ${description}`);
            resolve(stdout);
          } else {
            this.spinner.fail(`Failed: ${description} (exit code: ${code})`);
            const msg = stderr || `Command failed with exit code ${code}`;
            this.logger('error', `❌ ${description}: ${msg}`);
            reject(new Error(msg));
          }
        });
        stream.on('data', (data) => {
          stdout += data.toString();
          if (this.verbose) process.stdout.write(chalk.gray(data.toString()));
          String(data.toString())
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean)
            .forEach((line) => this.logger('info', line));
        });
        stream.stderr.on('data', (data) => {
          stderr += data.toString();
          if (this.verbose) process.stderr.write(chalk.red(data.toString()));
          String(data.toString())
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean)
            .forEach((line) => this.logger('warning', line));
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
    let pm;
    try {
      pm = (await this.executeCommand(
        'sh -lc "if command -v apt-get >/dev/null 2>&1; then echo apt; ' +
          'elif command -v dnf >/dev/null 2>&1; then echo dnf; ' +
          'elif command -v yum >/dev/null 2>&1; then echo yum; ' +
          'elif command -v apk >/dev/null 2>&1; then echo apk; ' +
          'elif command -v pacman >/dev/null 2>&1; then echo pacman; ' +
          'else echo unknown; fi"',
        'Detecting package manager'
      )).trim();
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not detect package manager, attempting default installation'));
      this.logger('warning', '⚠️  Could not detect package manager, attempting default installation');
      pm = 'unknown';
    }

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
          const msg = 'Failed to install Node.js automatically. Please install Node.js manually.';
          this.logger('error', `❌ ${msg}`);
          throw new Error(msg);
        }
      }
    }
  }

  async installNpm() {
    try {
      await this.executeCommand('npm --version', 'Checking npm installation');
    } catch (error) {
      console.log(chalk.yellow('⚠️  npm not detected after Node installation. Please ensure npm is installed.'));
      this.logger('warning', '⚠️  npm not detected after Node installation. Please ensure npm is installed.');
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
      this.logger('info', 'ℹ️  Skipping config file copy (local installation mode)');
      return;
    }
    const localConfigPath = path.join(os.homedir(), '.claude-code-router', 'config.json');
    if (!fs.existsSync(localConfigPath)) {
      console.log(chalk.yellow('⚠️  Local config.json not found, skipping config copy'));
      console.log(chalk.blue('💡 You can configure Claude Code manually after installation'));
      this.logger('warning', '⚠️  Local config.json not found, skipping config copy');
      return;
    }
    const configContent = fs.readFileSync(localConfigPath, 'utf8');
    const remoteHome = await this.getRemoteHome(username);
    return new Promise((resolve, reject) => {
      this.spinner = ora('Copying config.json to remote server...').start();
      this.conn.sftp((err, sftp) => {
        if (err) {
          this.spinner.fail('Failed to establish SFTP connection');
          this.logger('error', '❌ Failed to establish SFTP connection');
          reject(err);
          return;
        }
        const remoteDir = `${remoteHome}/.claude-code-router`;
        const remotePath = `${remoteDir}/config.json`;
        this.conn.exec(`mkdir -p ${remoteDir}`, (err) => {
          if (err) {
            this.spinner.fail('Failed to create remote directory');
            this.logger('error', '❌ Failed to create remote directory');
            reject(err);
            return;
          }
          const writeStream = sftp.createWriteStream(remotePath, { mode: 0o600 });
          writeStream.on('close', () => {
            this.spinner.succeed('Config file copied successfully');
            this.logger('success', '✅ Config file copied successfully');
            resolve();
          });
          writeStream.on('error', (err) => {
            this.spinner.fail('Failed to copy config file');
            this.logger('error', `❌ Failed to copy config file: ${err.message}`);
            reject(err);
          });
          writeStream.write(configContent);
          writeStream.end();
        });
      });
    });
  }

  async generateRemoteMultiProviderConfig(username, providers, preferredModel = null, routerOverrides = null) {
    const remoteHome = await this.getRemoteHome(username);
    const remoteDir = `${remoteHome}/.claude-code-router`;
    const configPath = `${remoteDir}/config.json`;
    this.spinner = ora('Generating multi-provider config on remote server...').start();
    try {
      const allProviders = [];
      let defaultProvider = null;
      let foundPreferred = false;
      
      // Process each provider
      for (const provider of providers) {
        let models = [];
        
        if (provider.name === 'openai') {
          try {
            const fetchedModels = await fetchOpenAIModels(provider.apiUrl || 'https://api.openai.com', provider.apiKey);
            const chatModels = filterChatModels(fetchedModels);
            models = chatModels.length > 0 ? chatModels : [
              'gpt-4-turbo-preview',
              'gpt-4',
              'gpt-3.5-turbo',
              'gpt-3.5-turbo-16k',
            ];
          } catch (e) {
            models = ['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo'];
          }
        } else if (provider.name === 'ucloud') {
          const { fetchUCloudModels } = require('./services/ucloud');
          try {
            const fetchedModels = await fetchUCloudModels(provider.apiUrl || 'https://api.modelverse.cn', provider.apiKey);
            models = filterChatModels(fetchedModels);
          } catch (e) {
            models = ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'];
          }
        } else if (provider.name === 'custom') {
          // For custom providers, try OpenAI-compatible endpoint
          try {
            const fetchedModels = await fetchOpenAIModels(provider.apiUrl, provider.apiKey);
            models = filterChatModels(fetchedModels);
          } catch (e) {
            models = ['default-model'];
          }
        }
        
        allProviders.push({
          name: provider.name,
          api_base_url: `${provider.apiUrl}/v1/chat/completions`,
          api_key: provider.apiKey,
          models: models
        });
        
        // Set default provider and model
        if (!foundPreferred && preferredModel && models.includes(preferredModel)) {
          defaultProvider = `${provider.name},${preferredModel}`;
          foundPreferred = true;
        } else if (!defaultProvider && models.length > 0) {
          defaultProvider = `${provider.name},${models[0]}`;
        }
      }
      
      // Build Router configuration
      let routerConfig = {
        default: defaultProvider || 'openai,gpt-4-turbo-preview',
        background: defaultProvider || 'openai,gpt-3.5-turbo',
        think: defaultProvider || 'openai,gpt-4',
        longContext: defaultProvider || 'openai,gpt-4-turbo-preview',
        longContextThreshold: 60000,
        webSearch: defaultProvider || 'openai,gpt-3.5-turbo',
      };

      // Apply router overrides if provided
      if (routerOverrides && typeof routerOverrides === 'object') {
        Object.keys(routerOverrides).forEach((field) => {
          const value = routerOverrides[field];
          if (value && typeof value === 'string') {
            routerConfig[field] = value;
          }
        });
      }

      const config = {
        LOG: false,
        CLAUDE_PATH: '',
        HOST: '127.0.0.1',
        PORT: 3456,
        APIKEY: providers[0].apiKey, // Fallback API key
        API_TIMEOUT_MS: '600000',
        PROXY_URL: '',
        Transformers: [],
        Providers: allProviders,
        Router: routerConfig,
      };
      await new Promise((resolve, reject) => {
        this.conn.exec(`mkdir -p ${remoteDir} && chmod 700 ${remoteDir}`, (mkErr) => {
          if (mkErr) return reject(mkErr);
          this.conn.sftp((err, sftp) => {
            if (err) return reject(err);
            const stream = sftp.createWriteStream(configPath, { mode: 0o600 });
            stream.on('error', reject);
            stream.on('close', resolve);
            stream.end(Buffer.from(JSON.stringify(config, null, 2)));
          });
        });
      });
      this.spinner.succeed('Multi-provider config generated on remote server');
      console.log(chalk.green(`✅ Config file created at: ${configPath}`));
      console.log(chalk.yellow(`📋 Configured ${allProviders.length} provider(s):`));
      allProviders.forEach(p => {
        console.log(chalk.blue(`   - ${p.name}: ${p.models.length} models`));
      });
      this.logger('success', `✅ Multi-provider config generated on remote server at: ${configPath}`);
    } catch (e) {
      this.spinner.fail('Failed to generate remote multi-provider config');
      this.logger('error', `❌ Failed to generate remote multi-provider config: ${e.message}`);
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

  // Legacy single-provider remote install (backward compatibility)
  async installRemote(
    host,
    username,
    auth,
    port,
    skipConfig = false,
    registry = null,
    openaiKey = null,
    openaiUrl = 'https://api.openai.com',
    userInstall = false,
    preferredModel = null,
    routerOverrides = null
  ) {
    // Convert to multi-provider format if openaiKey is provided
    const providers = openaiKey ? [{
      name: 'openai',
      apiKey: openaiKey,
      apiUrl: openaiUrl
    }] : [];
    
    return this.installRemoteWithProviders(
      host,
      username,
      auth,
      port,
      skipConfig,
      registry,
      providers,
      userInstall,
      preferredModel,
      routerOverrides
    );
  }
  
  // New multi-provider remote install
  async installRemoteWithProviders(
    host,
    username,
    auth,
    port,
    skipConfig = false,
    registry = null,
    providers = [],
    userInstall = false,
    preferredModel = null,
    routerOverrides = null
  ) {
    try {
      console.log(chalk.blue.bold('🚀 Installing Claude Code on remote server...\n'));
      this.logger('info', '🚀 Installing Claude Code on remote server...');

      await this.connect(host, username, auth, port);

      const hasNode = await this.checkNodeInstallation();
      if (!hasNode) {
        await this.installNode();
      }

      await this.installNpm();
      await this.installClaudeCode(registry, !userInstall);

      if (providers && providers.length > 0) {
        console.log(chalk.blue(`🔧 Generating config for ${providers.length} provider(s)...`));
        this.logger('info', `🔧 Generating config for ${providers.length} provider(s)...`);
        await this.generateRemoteMultiProviderConfig(username, providers, preferredModel, routerOverrides);
      } else if (!skipConfig) {
        await this.copyConfigFile(username, skipConfig);
      }

      await this.verifyInstallation();

      console.log(chalk.green.bold('\n✅ Claude Code installed successfully on remote server!'));
      console.log(chalk.cyan('🎉 You can now use Claude Code on your remote server.'));
      console.log(
        chalk.blue('\nℹ️  Tip: You can configure default models via `ccr ui` or by editing ~/.claude-code-router/config.json')
      );
      // First-time setup guidance if user is stuck at Claude login when running `ccr code`
      console.log(chalk.yellow('\n💡 First-time tip: If `ccr code` gets stuck on the Claude login screen, run this once:'));
      console.log(chalk.cyan('   ANTHROPIC_AUTH_TOKEN=token claude'));
      console.log(chalk.gray('   Then exit the `claude` CLI and run `ccr code` again.'));
      this.logger('info', '💡 First-time tip: If `ccr code` gets stuck on the Claude login screen, run: ANTHROPIC_AUTH_TOKEN=token claude; exit, then run `ccr code` again.');
      this.logger('success', '🎉 Remote installation completed successfully');
    } catch (error) {
      console.error(chalk.red.bold('\n❌ Remote installation failed:'), error.message);
      this.logger('error', `❌ Remote installation failed: ${error.message}`);
      if (this.exitOnFailure) {
        process.exit(1);
      } else {
        throw error;
      }
    } finally {
      await this.disconnect();
    }
  }
}

module.exports = { ClaudeRemoteInstaller };

