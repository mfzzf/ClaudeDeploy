#!/usr/bin/env node

const { Client } = require('ssh2');
const { program } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const fs = require('fs');
const path = require('path');
const os = require('os');

class ClaudeRemoteInstaller {
  constructor() {
    this.conn = new Client();
    this.spinner = null;
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
        }
      };

      // Support both password and key-based authentication
      if (auth.privateKey) {
        connectionConfig.privateKey = auth.privateKey;
        if (auth.passphrase) {
          connectionConfig.passphrase = auth.passphrase;
        }
      } else if (auth.password) {
        connectionConfig.password = auth.password;
      } else if (process.env.SSH_AUTH_SOCK) {
        // Use SSH agent for key management (like ssh-add)
        connectionConfig.agent = process.env.SSH_AUTH_SOCK;
      }

      this.conn.connect(connectionConfig);
    });
  }

  async executeCommand(command, description) {
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
        });

        stream.stderr.on('data', (data) => {
          stderr += data.toString();
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
    try {
      await this.executeCommand('curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -', 'Adding Node.js repository');
      await this.executeCommand('sudo apt-get install -y nodejs', 'Installing Node.js');
    } catch (error) {
      try {
        await this.executeCommand('curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -', 'Adding Node.js repository (RPM)');
        await this.executeCommand('sudo yum install -y nodejs', 'Installing Node.js (RPM)');
      } catch (rpmError) {
        throw new Error('Failed to install Node.js. Please install Node.js manually.');
      }
    }
  }

  async installNpm() {
    try {
      await this.executeCommand('npm --version', 'Checking npm installation');
    } catch (error) {
      await this.executeCommand('sudo apt-get install -y npm', 'Installing npm');
    }
  }

  async installClaudeCode(registry = null) {
    const registryFlag = registry ? ` --registry=${registry}` : '';
    await this.executeCommand(`sudo npm install -g @anthropic-ai/claude-code${registryFlag}`, 'Installing Claude Code');
    await this.executeCommand(`sudo npm install -g @musistudio/claude-code-router${registryFlag}`, 'Installing Claude Code Router');
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
    
    return new Promise((resolve, reject) => {
      this.spinner = ora('Copying config.json to remote server...').start();
      
      this.conn.sftp((err, sftp) => {
        if (err) {
          this.spinner.fail('Failed to establish SFTP connection');
          reject(err);
          return;
        }

        const remoteDir = `/home/${username}/.claude-code-router`;
        const remotePath = `${remoteDir}/config.json`;

        // Create remote directory if it doesn't exist
        this.conn.exec(`mkdir -p ${remoteDir}`, (err) => {
          if (err) {
            this.spinner.fail('Failed to create remote directory');
            reject(err);
            return;
          }

          const writeStream = sftp.createWriteStream(remotePath);
          
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

  async verifyInstallation() {
    await this.executeCommand('claude --version', 'Verifying Claude Code installation');
    await this.executeCommand('ccr -v', 'Verifying Claude Code Router installation');
  }

  async disconnect() {
    if (this.conn) {
      this.conn.end();
    }
  }

  async installLocal(registry = null) {
    console.log(chalk.blue.bold('🚀 Installing Claude Code locally...\n'));
    
    try {
      // Check if Node.js is installed locally
      try {
        // First try to find node executable
        const nodeCheckCommand = process.platform === 'win32' ? 'where node' : 'which node';
        await this.executeCommandLocally(nodeCheckCommand);
        await this.executeCommandLocally('node --version');
        console.log(chalk.green('✅ Node.js is already installed'));
      } catch (error) {
        console.log(chalk.red('❌ Node.js is not installed locally'));
        console.log(chalk.yellow('💡 Please install Node.js from https://nodejs.org/'));
        process.exit(1);
      }

      // Install Claude Code locally
      const registryFlag = registry ? ` --registry=${registry}` : '';
      await this.executeCommandLocally(`npm install -g @anthropic-ai/claude-code${registryFlag}`);
      await this.executeCommandLocally(`npm install -g @musistudio/claude-code-router${registryFlag}`);
      
      // Verify installation
      await this.executeCommandLocally('claude --version');
      await this.executeCommandLocally('ccr -v');

      console.log(chalk.green.bold('\n✅ Claude Code installed successfully on your computer!'));
      console.log(chalk.cyan('🎉 You can now use `claude` and `ccr` commands locally.'));

    } catch (error) {
      console.error(chalk.red.bold('\n❌ Local installation failed:'), error.message);
      process.exit(1);
    }
  }

  async generateUCloudConfig(apiKey, baseUrl = 'https://deepseek.modelverse.cn') {
    const configDir = path.join(os.homedir(), '.claude-code-router');
    const configPath = path.join(configDir, 'config.json');
    
    try {
      console.log(chalk.blue('🔍 Fetching available models from UCloud API...'));
      
      // Fetch models from API
      const https = require('https');
      const models = await this.fetchUCloudModels(baseUrl, apiKey);
      
      // Filter models to exclude image/text-to-image models and focus on chat models
      const chatModels = models.filter(model => 
        !model.includes('flux') && 
        !model.includes('text-to-image') && 
        !model.includes('multi') &&
        !model.includes('image') &&
        !model.includes('edit') &&
        !model.includes('vl') &&
        model.includes('deepseek') || 
        model.includes('zai-org') || 
        model.includes('moonshotai') || 
        model.includes('glm') ||
        model.includes('ernie') ||
        model.includes('baidu') ||
        model.includes('openai')||
        model.includes('Qwen')
      );

      const finalModels = chatModels.length > 0 ? chatModels : [
        "Qwen/Qwen3-Coder",
        "moonshotai/Kimi-K2-Instruct", 
        "deepseek-ai/DeepSeek-R1-0528",
        "deepseek-ai/DeepSeek-V3-0324",
        "zai-org/glm-4.5"
      ];

      const ucloudConfig = {
        "LOG": false,
        "CLAUDE_PATH": "",
        "HOST": "127.0.0.1",
        "PORT": 3456,
        "APIKEY": "test123456",
        "API_TIMEOUT_MS": "600000",
        "PROXY_URL": "",
        "Transformers": [],
        "Providers": [
          {
            "name": "ucloud",
            "api_base_url": `${baseUrl}/v1/chat/completions`,
            "api_key": apiKey,
            "models": finalModels,
          }
        ],
        "Router": {
          "default": "ucloud,moonshotai/Kimi-K2-Instruct",
          "background": "ucloud,moonshotai/Kimi-K2-Instruct",
          "think": "ucloud,moonshotai/Kimi-K2-Instruct",
          "longContext": "ucloud,moonshotai/Kimi-K2-Instruct",
          "longContextThreshold": 60000,
          "webSearch": "ucloud,moonshotai/Kimi-K2-Instruct"
        }
      };

      // Create directory if it doesn't exist
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      // Write config file
      fs.writeFileSync(configPath, JSON.stringify(ucloudConfig, null, 2));
      
      console.log(chalk.green(`✅ UCloud config generated at: ${configPath}`));
      console.log(chalk.blue(`🎯 Configured for: ${baseUrl}`));
      console.log(chalk.yellow(`📋 Models available: ${models.join(', ')}`));
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to generate UCloud config:'), error.message);
      console.log(chalk.yellow('💡 Using default models instead...'));
      
      // Use actual fetched models or fallback to your exact format
      const chatModels = models.filter(model => 
        !model.includes('flux') && 
        !model.includes('text-to-image') && 
        !model.includes('multi') &&
        !model.includes('image') &&
        !model.includes('edit') &&
        !model.includes('vl')
      );

      const finalModels = chatModels.length > 0 ? chatModels : [
        "Qwen/Qwen3-Coder",
        "moonshotai/Kimi-K2-Instruct",
        "deepseek-ai/DeepSeek-R1-0528",
        "deepseek-ai/DeepSeek-V3-0324",
        "zai-org/glm-4.5"
      ];

      const fallbackConfig = {
        "LOG": false,
        "CLAUDE_PATH": "",
        "HOST": "127.0.0.1",
        "PORT": 3456,
        "APIKEY": apiKey,
        "API_TIMEOUT_MS": "600000",
        "PROXY_URL": "",
        "Transformers": [],
        "Providers": [
          {
            "name": "ucloud",
            "api_base_url": `${baseUrl}/v1/chat/completions`,
            "api_key": apiKey,
            "models": finalModels,
            "transformer": {
              "use": [
                {
                  "max_tokens": 16384
                }
              ]
            }
          }
        ],
        "Router": {
          "default": "ucloud,moonshotai/Kimi-K2-Instruct",
          "background": "ucloud,moonshotai/Kimi-K2-Instruct",
          "think": "ucloud,Qwen/Qwen3-Coder",
          "longContext": "ucloud,moonshotai/Kimi-K2-Instruct",
          "longContextThreshold": 60000,
          "webSearch": "ucloud,moonshotai/Kimi-K2-Instruct"
        }
      };

      fs.writeFileSync(configPath, JSON.stringify(fallbackConfig, null, 2));
      console.log(chalk.green(`✅ Fallback config generated at: ${configPath}`));
    }
  }

  async fetchUCloudModels(baseUrl, apiKey) {
    return new Promise((resolve, reject) => {
      const https = require('https');
      const url = new URL(`${baseUrl}/v1/models`);
      
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.data && Array.isArray(response.data)) {
              const models = response.data.map(model => model.id || model.name).filter(Boolean);
              resolve(models.length > 0 ? models : ["deepseek-chat", "deepseek-reasoner"]);
            } else {
              resolve(["deepseek-chat", "deepseek-reasoner"]);
            }
          } catch (error) {
            console.warn(chalk.yellow('⚠️  Could not parse API response, using default models'));
            resolve(["deepseek-chat", "deepseek-reasoner"]);
          }
        });
      });

      req.on('error', (error) => {
        console.warn(chalk.yellow('⚠️  Could not fetch models from API, using default models'));
        resolve(["deepseek-chat", "deepseek-reasoner"]);
      });

      req.setTimeout(5000, () => {
        console.warn(chalk.yellow('⚠️  API request timeout, using default models'));
        resolve(["deepseek-chat", "deepseek-reasoner"]);
      });

      req.end();
    });
  }

  async executeCommandLocally(command) {
    return new Promise((resolve, reject) => {
      const { exec } = require('child_process');
      const spinner = ora(`Running: ${command}`).start();
      
      exec(command, {
        env: process.env,
        shell: true
      }, (error, stdout, stderr) => {
        if (error) {
          spinner.fail(`Failed: ${command}`);
          reject(error);
        } else {
          spinner.succeed(`Completed: ${command}`);
          resolve(stdout);
        }
      });
    });
  }

  async installRemote(host, username, auth, port, skipConfig = false, registry = null) {
    try {
      console.log(chalk.blue.bold('🚀 Installing Claude Code on remote server...\n'));

      await this.connect(host, username, auth, port);

      // Check and install Node.js if needed
      const hasNode = await this.checkNodeInstallation();
      if (!hasNode) {
        await this.installNode();
      }

      await this.installNpm();
      await this.installClaudeCode(registry);
      await this.copyConfigFile(username, skipConfig);
      await this.verifyInstallation();

      console.log(chalk.green.bold('\n✅ Claude Code installed successfully on remote server!'));
      console.log(chalk.cyan('🎉 You can now use Claude Code on your remote server.'));

    } catch (error) {
      console.error(chalk.red.bold('\n❌ Remote installation failed:'), error.message);
      process.exit(1);
    } finally {
      await this.disconnect();
    }
  }
}

// CLI interface
const packageJson = require('./package.json');
program
  .name('claudedeploy')
  .description('Universal Claude Code installer - works on local computer and remote servers')
  .version(packageJson.version)
  .option('--local', 'Install Claude Code on this local computer')
  .option('--generate-config', 'Generate UCloud config.json with API key')
  .option('--ucloud-key <key>', 'UCloud API key for config generation')
  .option('--ucloud-url <url>', 'UCloud base URL (default: https://deepseek.modelverse.cn)', 'https://deepseek.modelverse.cn')
  .option('-h, --host <host>', 'Remote server hostname or IP (for remote installation)')
  .option('-u, --username <username>', 'SSH username (for remote installation)')
  .option('-p, --password <password>', 'SSH password (will prompt if not provided)')
  .option('-k, --key <path>', 'SSH private key file path (for remote installation)')
  .option('--passphrase <passphrase>', 'SSH key passphrase (will prompt if not provided)')
  .option('--port <port>', 'SSH port (default: 22)', '22')
  .option('--skip-config', 'Skip copying config.json (for remote installation)')
  .option('--registry <registry>', 'npm registry URL (e.g., https://registry.npmmirror.com)')
  .action(async (options) => {
    const installer = new ClaudeRemoteInstaller();
    
    if (options.generateConfig) {
      // Generate UCloud config
      if (!options.ucloudKey) {
        console.error(chalk.red('❌ --ucloud-key is required for config generation'));
        process.exit(1);
      }
      
      await installer.generateUCloudConfig(options.ucloudKey, options.ucloudUrl);
    } else if (options.local) {
      // Local installation
      if (options.ucloudKey) {
        console.log(chalk.blue('🔧 Generating UCloud config for local installation...'));
        await installer.generateUCloudConfig(options.ucloudKey, options.ucloudUrl);
      }
      await installer.installLocal(options.registry);
    } else if (options.host && options.username) {
      // Remote installation
      const fs = require('fs');
      let auth = {};
      
      // Handle authentication priority: explicit password > explicit key > SSH agent > default keys
      if (options.password) {
        // Use explicit password if provided
        auth.password = options.password;
        console.log(chalk.blue('Using provided password for authentication'));
      } else if (options.key) {
        // Use explicit SSH key if provided
        try {
          const keyPath = options.key.startsWith('~/') 
            ? path.join(os.homedir(), options.key.slice(2)) 
            : options.key;
          
          if (!fs.existsSync(keyPath)) {
            console.error(chalk.red('SSH key file not found:'), keyPath);
            process.exit(1);
          }
          
          auth.privateKey = fs.readFileSync(keyPath);
          console.log(chalk.blue(`Using SSH key: ${keyPath}`));
          
          if (options.passphrase) {
            auth.passphrase = options.passphrase;
          } else {
            const readline = require('readline');
            const rl = readline.createInterface({
              input: process.stdin,
              output: process.stdout
            });

            const passphrase = await new Promise((resolve) => {
              rl.question('SSH Key Passphrase (optional): ', (answer) => {
                rl.close();
                resolve(answer);
              });
            });
            
            if (passphrase) {
              auth.passphrase = passphrase;
            }
          }
        } catch (error) {
          console.error(chalk.red('Error reading SSH key file:'), error.message);
          process.exit(1);
        }
      } else if (process.env.SSH_AUTH_SOCK) {
        // SSH agent will handle authentication automatically
        console.log(chalk.blue('Using SSH agent for authentication'));
      } else {
        // Try to find default SSH keys
        const defaultKeys = [
          path.join(os.homedir(), '.ssh', 'id_rsa'),
          path.join(os.homedir(), '.ssh', 'id_ed25519'),
          path.join(os.homedir(), '.ssh', 'id_ecdsa')
        ];
        
        let foundKey = false;
        for (const keyPath of defaultKeys) {
          if (fs.existsSync(keyPath)) {
            try {
              auth.privateKey = fs.readFileSync(keyPath);
              console.log(chalk.blue(`Using SSH key: ${keyPath}`));
              foundKey = true;
              break;
            } catch (error) {
              console.warn(chalk.yellow(`Could not read key ${keyPath}: ${error.message}`));
            }
          }
        }
        
        // Fallback to password if no keys found
        if (!foundKey) {
          let password = options.password;
          
          if (!password) {
            const readline = require('readline');
            const rl = readline.createInterface({
              input: process.stdin,
              output: process.stdout
            });

            password = await new Promise((resolve) => {
              rl.question('SSH Password: ', (answer) => {
                rl.close();
                resolve(answer);
              });
            });
          }
          
          auth.password = password;
        }
      }

      await installer.installRemote(options.host, options.username, auth, parseInt(options.port), options.skipConfig, options.registry);
    } else {
      console.error(chalk.red('❌ Please specify one of:'));
      console.log(chalk.yellow('  claudedeploy --generate-config --ucloud-key YOUR_KEY    # Generate UCloud config'));
      console.log(chalk.yellow('  claudedeploy --local                                      # Install on this computer'));
      console.log(chalk.yellow('  claudedeploy -h server.com -u username                    # Install on remote server'));
      process.exit(1);
    }
  });

if (require.main === module) {
  program.parse();
}

module.exports = ClaudeRemoteInstaller;