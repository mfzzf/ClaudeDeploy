'use strict';

const chalk = require('chalk');
const ora = require('ora');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { validateRegistryUrl, filterChatModels } = require('./utils');
const { fetchUCloudModels } = require('./services/ucloud');

class LocalInstaller {
  constructor() {
    this.verbose = false;
    this.dryRun = false;
  }

  async executeCommandLocally(command) {
    if (this.dryRun) {
      console.log(chalk.cyan(`[DRY-RUN][local] ${command}`));
      return '';
    }
    const { exec } = require('child_process');
    const spinner = ora(`Running: ${command}`).start();
    const execOptions = {
      env: { ...process.env, PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin' },
      shell: true,
      cwd: process.cwd(),
    };
    return new Promise((resolve, reject) => {
      exec(command, execOptions, (error, stdout, stderr) => {
        if (error) {
          spinner.fail(`Failed: ${command}`);
          console.log(chalk.gray(`Error: ${error.message}`));
          if (stderr) console.log(chalk.gray(`Stderr: ${stderr.trim()}`));
          reject(error);
        } else {
          spinner.succeed(`Completed: ${command}`);
          if (this.verbose && stdout) process.stdout.write(chalk.gray(stdout));
          resolve(stdout);
        }
      });
    });
  }

  async installLocal(registry = null) {
    console.log(chalk.blue.bold('🚀 Installing Claude Code locally...\n'));
    try {
      // Node check
      try {
        const isPackaged = process.pkg !== undefined;
        if (isPackaged) {
          const nodeCheckCommand = process.platform === 'win32' ? 'where node.exe' : 'which node';
          const nodePath = await this.executeCommandLocally(nodeCheckCommand);
          const actualNodePath = nodePath.trim().split('\n')[0];
          await this.executeCommandLocally(`"${actualNodePath}" --version`);
          console.log(chalk.green('✅ Node.js is already installed'));
        } else {
          const nodeCheckCommand = process.platform === 'win32' ? 'where node' : 'which node';
          await this.executeCommandLocally(nodeCheckCommand);
          await this.executeCommandLocally('node --version');
          console.log(chalk.green('✅ Node.js is already installed'));
        }
      } catch (error) {
        console.log(chalk.red('❌ Node.js is not installed locally'));
        console.log(chalk.yellow('💡 Please install Node.js from https://nodejs.org/'));
        console.log(chalk.gray("   After installing Node.js, make sure it's in your PATH"));
        process.exit(1);
      }

      // npm check
      try {
        await this.executeCommandLocally('npm --version');
        console.log(chalk.green('✅ npm is available'));
      } catch (error) {
        console.log(chalk.red('❌ npm is not available'));
        console.log(chalk.yellow('💡 Please ensure npm is installed with Node.js'));
        process.exit(1);
      }

      const validatedRegistry = validateRegistryUrl(registry);
      const registryArg = validatedRegistry ? ` --registry="${validatedRegistry}"` : '';
      await this.executeCommandLocally(`npm install -g @anthropic-ai/claude-code${registryArg}`);
      await this.executeCommandLocally(`npm install -g @musistudio/claude-code-router${registryArg}`);

      await this.executeCommandLocally('claude --version');
      await this.executeCommandLocally('ccr -v');

      console.log(chalk.green.bold('\n✅ Claude Code installed successfully on your computer!'));
      console.log(chalk.cyan('🎉 You can now use `claude` and `ccr` commands locally.'));
      console.log(chalk.blue('\nℹ️  Tip: You can configure default models via `ccr ui` or by editing ~/.claude-code-router/config.json'));
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
      if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
      fs.writeFileSync(configPath, JSON.stringify(ucloudConfig, null, 2));
      console.log(chalk.green(`✅ UCloud config generated at: ${configPath}`));
      console.log(chalk.blue(`🎯 Configured for: ${baseUrl}`));
      console.log(chalk.yellow(`📋 Models available: ${models.join(', ')}`));
    } catch (error) {
      console.error(chalk.red('❌ Failed to generate UCloud config:'), error.message);
      const finalModels = ['Qwen/Qwen3-Coder', 'moonshotai/Kimi-K2-Instruct', 'deepseek-ai/DeepSeek-R1-0528', 'deepseek-ai/DeepSeek-V3-0324', 'zai-org/glm-4.5'];
      const fallbackConfig = {
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
            transformer: { use: [{ max_tokens: 16384 }] },
          },
        ],
        Router: {
          default: 'ucloud,moonshotai/Kimi-K2-Instruct',
          background: 'ucloud,moonshotai/Kimi-K2-Instruct',
          think: 'ucloud,Qwen/Qwen3-Coder',
          longContext: 'ucloud,moonshotai/Kimi-K2-Instruct',
          longContextThreshold: 60000,
          webSearch: 'ucloud,moonshotai/Kimi-K2-Instruct',
        },
      };
      if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
      fs.writeFileSync(configPath, JSON.stringify(fallbackConfig, null, 2));
      console.log(chalk.green(`✅ Fallback config generated at: ${configPath}`));
    }
  }

  // fetchUCloudModels moved to services/ucloud
}

module.exports = { LocalInstaller };

