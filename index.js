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
      } else if (process.env.SSH_AUTH_SOCK) {
        // Use SSH agent for key management (like ssh-add)
        connectionConfig.agent = process.env.SSH_AUTH_SOCK;
      } else if (auth.password) {
        connectionConfig.password = auth.password;
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

  async installClaudeCode() {
    await this.executeCommand('sudo npm install -g @anthropic-ai/claude-code', 'Installing Claude Code');
    await this.executeCommand('sudo npm install -g @musistudio/claude-code-router', 'Installing Claude Code Router');
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

  async installLocal() {
    console.log(chalk.blue.bold('🚀 Installing Claude Code locally...\n'));
    
    try {
      // Check if Node.js is installed locally
      try {
        await this.executeCommandLocally('node --version');
        console.log(chalk.green('✅ Node.js is already installed'));
      } catch (error) {
        console.log(chalk.red('❌ Node.js is not installed locally'));
        console.log(chalk.yellow('💡 Please install Node.js from https://nodejs.org/'));
        process.exit(1);
      }

      // Install Claude Code locally
      await this.executeCommandLocally('npm install -g @anthropic-ai/claude-code');
      await this.executeCommandLocally('npm install -g @musistudio/claude-code-router');
      
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

  async executeCommandLocally(command) {
    return new Promise((resolve, reject) => {
      const { exec } = require('child_process');
      const spinner = ora(`Running: ${command}`).start();
      
      exec(command, (error, stdout, stderr) => {
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

  async installRemote(host, username, auth, port, skipConfig = false) {
    try {
      console.log(chalk.blue.bold('🚀 Installing Claude Code on remote server...\n'));

      await this.connect(host, username, auth, port);

      // Check and install Node.js if needed
      const hasNode = await this.checkNodeInstallation();
      if (!hasNode) {
        await this.installNode();
      }

      await this.installNpm();
      await this.installClaudeCode();
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
program
  .name('claudedeploy')
  .description('Universal Claude Code installer - works on local computer and remote servers')
  .version('1.0.0')
  .option('--local', 'Install Claude Code on this local computer')
  .option('-h, --host <host>', 'Remote server hostname or IP (for remote installation)')
  .option('-u, --username <username>', 'SSH username (for remote installation)')
  .option('-p, --password <password>', 'SSH password (will prompt if not provided)')
  .option('-k, --key <path>', 'SSH private key file path (for remote installation)')
  .option('--passphrase <passphrase>', 'SSH key passphrase (will prompt if not provided)')
  .option('--port <port>', 'SSH port (default: 22)', '22')
  .option('--skip-config', 'Skip copying config.json (for remote installation)')
  .action(async (options) => {
    const installer = new ClaudeRemoteInstaller();
    
    if (options.local) {
      // Local installation
      await installer.installLocal();
    } else if (options.host && options.username) {
      // Remote installation
      const fs = require('fs');
      let auth = {};
      
      // Handle SSH key authentication
      if (options.key) {
        try {
          const keyPath = options.key.startsWith('~/') 
            ? path.join(os.homedir(), options.key.slice(2)) 
            : options.key;
          
          if (!fs.existsSync(keyPath)) {
            console.error(chalk.red('SSH key file not found:'), keyPath);
            process.exit(1);
          }
          
          auth.privateKey = fs.readFileSync(keyPath);
          
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
        
        for (const keyPath of defaultKeys) {
          if (fs.existsSync(keyPath)) {
            try {
              auth.privateKey = fs.readFileSync(keyPath);
              console.log(chalk.blue(`Using SSH key: ${keyPath}`));
              break;
            } catch (error) {
              console.warn(chalk.yellow(`Could not read key ${keyPath}: ${error.message}`));
            }
          }
        }
        
        // Fallback to password if no keys found
        if (!auth.privateKey && !process.env.SSH_AUTH_SOCK) {
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

      await installer.installRemote(options.host, options.username, auth, parseInt(options.port), options.skipConfig);
    } else {
      console.error(chalk.red('❌ Please specify either --local for local installation or -h/-u for remote installation'));
      console.log(chalk.yellow('💡 Examples:'));
      console.log(chalk.yellow('  claudedeploy --local                    # Install on this computer'));
      console.log(chalk.yellow('  claudedeploy -h server.com -u ubuntu    # Install on remote server'));
      process.exit(1);
    }
  });

if (require.main === module) {
  program.parse();
}

module.exports = ClaudeRemoteInstaller;