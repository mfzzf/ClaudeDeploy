'use strict';

const { program } = require('commander');
const chalk = require('chalk');
const path = require('path');
const os = require('os');
const readline = require('readline');
const { ClaudeRemoteInstaller } = require('./installer');
const { LocalInstaller } = require('./local');
const packageJson = require('../package.json');

function printPathHints(isRemote = false) {
  console.log('\n' + chalk.gray('If you see "command not found", ensure your PATH includes global npm binaries.'));
  console.log(chalk.gray('Common fixes:'));
  console.log(chalk.gray('  - echo "export PATH=$(npm bin -g):$PATH" >> ~/.bashrc && source ~/.bashrc'));
  console.log(chalk.gray('  - For zsh: echo "export PATH=$(npm bin -g):$PATH" >> ~/.zshrc && source ~/.zshrc'));
  if (isRemote) console.log(chalk.gray('  - On remote, check the shell rc files for the target user.'));
}

async function runCli() {
  program
    .name('claudedeploy')
    .description('Universal Claude Code installer - works on local computer and remote servers')
    .version(packageJson.version)
    .option('--verbose', 'Enable verbose output')
    .option('--dry-run', 'Print commands without executing them')
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
    .option('--user-install', 'Install without sudo (user-level global)')
    .action(async (options) => {
      if (options.generateConfig) {
        if (!options.ucloudKey) {
          console.error(chalk.red('❌ --ucloud-key is required for config generation'));
          process.exit(1);
        }
        const local = new LocalInstaller();
        local.verbose = !!options.verbose;
        local.dryRun = !!options.dryRun;
        await local.generateUCloudConfig(options.ucloudKey, options.ucloudUrl);
        return;
      }

      if (options.local) {
        const local = new LocalInstaller();
        local.verbose = !!options.verbose;
        local.dryRun = !!options.dryRun;
        if (options.ucloudKey) {
          console.log(chalk.blue('🔧 Generating UCloud config for local installation...'));
          await local.generateUCloudConfig(options.ucloudKey, options.ucloudUrl);
        }
        await local.installLocal(options.registry);
        printPathHints(false);
        return;
      }

      if (options.host && options.username) {
        const installer = new ClaudeRemoteInstaller();
        installer.verbose = !!options.verbose;
        installer.dryRun = !!options.dryRun;

        const fs = require('fs');
        const auth = {};
        if (options.password) {
          auth.password = options.password;
          console.log(chalk.blue('Using provided password for authentication'));
        } else if (options.key) {
          try {
            const keyPath = options.key.startsWith('~/') ? path.join(os.homedir(), options.key.slice(2)) : options.key;
            if (!fs.existsSync(keyPath)) {
              console.error(chalk.red('SSH key file not found:'), keyPath);
              process.exit(1);
            }
            auth.privateKey = fs.readFileSync(keyPath);
            console.log(chalk.blue(`Using SSH key: ${keyPath}`));
            if (options.passphrase) {
              auth.passphrase = options.passphrase;
            } else {
              const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
              const muteOutput = (stream, mute) => {
                const write = stream.write;
                stream.write = function (string, encoding, fd) {
                  if (mute) return true;
                  return write.apply(stream, [string, encoding, fd]);
                };
                return () => (stream.write = write);
              };
              const unmute = muteOutput(process.stdout, true);
              const passphrase = await new Promise((resolve) => {
                rl.question('SSH Key Passphrase (optional): ', (answer) => {
                  unmute();
                  rl.close();
                  console.log();
                  resolve(answer);
                });
              });
              if (passphrase) auth.passphrase = passphrase;
            }
          } catch (error) {
            console.error(chalk.red('Error reading SSH key file:'), error.message);
            process.exit(1);
          }
        } else if (process.env.SSH_AUTH_SOCK) {
          console.log(chalk.blue('Using SSH agent for authentication'));
        } else {
          const defaultKeys = [path.join(os.homedir(), '.ssh', 'id_rsa'), path.join(os.homedir(), '.ssh', 'id_ed25519'), path.join(os.homedir(), '.ssh', 'id_ecdsa')];
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
          if (!foundKey) {
            const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
            const muteOutput = (stream, mute) => {
              const write = stream.write;
              stream.write = function (string, encoding, fd) {
                if (mute) return true;
                return write.apply(stream, [string, encoding, fd]);
              };
              return () => (stream.write = write);
            };
            const unmute = muteOutput(process.stdout, true);
            const password = await new Promise((resolve) => {
              rl.question('SSH Password: ', (answer) => {
                unmute();
                rl.close();
                console.log();
                resolve(answer);
              });
            });
            auth.password = password;
          }
        }

        await installer.installRemote(
          options.host,
          options.username,
          auth,
          parseInt(options.port),
          options.skipConfig,
          options.registry,
          options.ucloudKey,
          options.ucloudUrl,
          !!options.userInstall
        );
        printPathHints(true);
        return;
      }

      console.error(chalk.red('❌ Please specify one of:'));
      console.log(chalk.yellow('  claudedeploy --generate-config --ucloud-key YOUR_KEY    # Generate UCloud config'));
      console.log(chalk.yellow('  claudedeploy --local                                      # Install on this computer'));
      console.log(chalk.yellow('  claudedeploy -h server.com -u username                    # Install on remote server'));
      process.exit(1);
    });

  program.parse();
}

module.exports = { runCli };

