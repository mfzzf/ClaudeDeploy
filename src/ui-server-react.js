'use strict';

const express = require('express');
const path = require('path');
const chalk = require('chalk');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const os = require('os');
const fs = require('fs');
const { ClaudeRemoteInstaller } = require('./installer');
const { LocalInstaller } = require('./local');

class UIServer {
  constructor(port = 3456) {
    this.port = port;
    this.app = express();
    this.server = null;
    this.wss = null;
    this.installations = [];
    this.clients = new Set();
    this.setupMiddleware();
    this.setupRoutes();
  }

  sanitizeInstallation(installation) {
    if (!installation) return installation;
    const clone = JSON.parse(JSON.stringify(installation));
    if (clone.config) {
      // Mask provider credentials
      if (Array.isArray(clone.config.providers)) {
        clone.config.providers = clone.config.providers.map((p) => ({
          ...p,
          apiKey: p.apiKey ? '***' : p.apiKey,
        }));
      } else if (clone.config.providers && typeof clone.config.providers === 'object') {
        const providers = clone.config.providers;
        ['openai', 'ucloud', 'custom'].forEach((k) => {
          if (providers[k]) {
            if (providers[k].apiKey) providers[k].apiKey = '***';
          }
        });
      }
      // Remove/Mask remote auth fields
      ['password', 'privateKey', 'passphrase'].forEach((k) => {
        if (k in clone.config) clone.config[k] = undefined;
      });
    }
    return clone;
  }

  setupMiddleware() {
    // Parse JSON bodies
    this.app.use(express.json());
    
    // CORS for development
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      next();
    });
  }

  setupRoutes() {
    // API Routes
    this.app.get('/api/status', (req, res) => {
      res.json({
        status: 'running',
        version: require('../package.json').version,
        platform: process.platform,
        nodeVersion: process.version,
        installations: this.installations.length
      });
    });

    this.app.get('/api/installations', (req, res) => {
      res.json(this.installations.map((i) => this.sanitizeInstallation(i)));
    });

    this.app.post('/api/install/local', async (req, res) => {
      try {
        await this.handleLocalInstall(req.body);
        res.json({ success: true, message: 'Local installation started' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/install/remote', async (req, res) => {
      try {
        await this.handleRemoteInstall(req.body);
        res.json({ success: true, message: 'Remote installation started' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/fetch-models', async (req, res) => {
      try {
        const { provider, apiKey, apiUrl } = req.body;
        let models = [];
        
        if (provider === 'openai') {
          const { fetchOpenAIModels } = require('./services/openai');
          models = await fetchOpenAIModels(apiUrl, apiKey);
        } else if (provider === 'ucloud') {
          const { fetchUCloudModels } = require('./services/ucloud');
          models = await fetchUCloudModels(apiUrl, apiKey);
        } else if (provider === 'custom') {
          // For custom providers, try OpenAI-compatible endpoint
          const { fetchOpenAIModels } = require('./services/openai');
          models = await fetchOpenAIModels(apiUrl, apiKey);
        }
        
        // Return all models without filtering
        res.json({ success: true, models });
      } catch (error) {
        res.status(500).json({ error: error.message, models: [] });
      }
    });

    this.app.post('/api/generate-config', async (req, res) => {
      try {
        const configPath = await this.handleGenerateConfig(req.body);
        res.json({ success: true, path: configPath, message: 'Configuration generated successfully' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Serve React app or HTML UI
    const reactBuildPath = path.join(__dirname, '..', 'ui-react', 'dist');
    const htmlUIPath = path.join(__dirname, '..', 'ui');
    
    // Check if React build exists
    if (fs.existsSync(reactBuildPath)) {
      // Serve built React app
      this.app.use(express.static(reactBuildPath));
      this.app.get('*', (req, res) => {
        res.sendFile(path.join(reactBuildPath, 'index.html'));
      });
    } else {
      // Serve HTML UI as fallback
      this.app.use(express.static(htmlUIPath));
      this.app.get('/', (req, res) => {
        res.sendFile(path.join(htmlUIPath, 'index.html'));
      });
    }
  }

  async start() {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        console.log(chalk.green(`✅ ClaudeDeploy server is running at: http://localhost:${this.port}`));
        
        // Check if React build exists
        const reactBuildPath = path.join(__dirname, '..', 'ui-react', 'dist');
        if (fs.existsSync(reactBuildPath)) {
          console.log(chalk.blue('📱 Serving React UI'));
        } else {
          console.log(chalk.blue('📱 Serving HTML UI'));
          console.log(chalk.yellow('💡 To use React UI instead, run:'));
          console.log(chalk.cyan('    cd ui-react'));
          console.log(chalk.cyan('    npm install'));
          console.log(chalk.cyan('    npm run build'));
          console.log(chalk.gray('Tip: In dev mode, set CLAUDEDEPLOY_PORT to match this server port for the Vite proxy.'));
        }
        console.log(chalk.gray('Press Ctrl+C to stop the server'));
        
        this.setupWebSocket();
        resolve();
      });
    });
  }

  setupWebSocket() {
    this.wss = new WebSocket.Server({ server: this.server, path: '/ws' });
    
    this.wss.on('connection', (ws) => {
      console.log(chalk.green('🔌 WebSocket client connected'));
      this.clients.add(ws);
      
      // Send initial connection message
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to ClaudeDeploy WebSocket'
      }));
      
      ws.on('close', () => {
        console.log(chalk.yellow('🔌 WebSocket client disconnected'));
        this.clients.delete(ws);
      });
      
      ws.on('error', (error) => {
        console.error(chalk.red('WebSocket error:'), error);
        this.clients.delete(ws);
      });
    });
  }

  // Broadcast message to all connected WebSocket clients
  broadcast(message) {
    const data = JSON.stringify(message);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  // Send log message to browser
  sendLog(message, type = 'info') {
    this.broadcast({
      type: 'log',
      level: type,
      message: message,
      timestamp: new Date().toISOString()
    });
  }

  // Execute command with real-time output streaming
  async executeWithLogging(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        ...options,
        shell: true
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        const text = data.toString();
        stdout += text;
        this.sendLog(text.trim(), 'info');
      });

      child.stderr.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        this.sendLog(text.trim(), 'warning');
      });

      child.on('close', (code) => {
        if (code === 0) {
          this.sendLog(`✅ Command completed successfully`, 'success');
          resolve(stdout);
        } else {
          this.sendLog(`❌ Command failed with exit code ${code}`, 'error');
          reject(new Error(stderr || `Command failed with exit code ${code}`));
        }
      });

      child.on('error', (err) => {
        this.sendLog(`❌ Command error: ${err.message}`, 'error');
        reject(err);
      });
    });
  }

  async handleLocalInstall(config) {
    const installId = Date.now().toString();
    const installation = {
      id: installId,
      type: 'local',
      status: 'pending',
      timestamp: new Date().toISOString(),
      config
    };
    
    this.installations.push(installation);
    this.sendLog('🚀 Starting local installation...', 'info');
    
    try {
      const installer = new LocalInstaller({
        logger: (level, message) => this.sendLog(message, level),
        exitOnFailure: false,
      });
      installer.verbose = config.verbose || false;
      
      // Normalize providers and generate config
      if (config.providers) {
        let providersArr = [];
        const p = config.providers;
        if (Array.isArray(p)) {
          providersArr = p;
        } else {
          if (p.openai?.enabled && p.openai?.apiKey) {
            providersArr.push({ name: 'openai', apiKey: p.openai.apiKey, apiUrl: p.openai.url || 'https://api.openai.com' });
          }
          if (p.ucloud?.enabled && p.ucloud?.apiKey) {
            providersArr.push({ name: 'ucloud', apiKey: p.ucloud.apiKey, apiUrl: p.ucloud.url || 'https://api.modelverse.cn' });
          }
          if (p.custom?.enabled && p.custom?.apiKey && (p.custom.customUrl || p.custom.url)) {
            providersArr.push({ name: 'custom', apiKey: p.custom.apiKey, apiUrl: p.custom.customUrl || p.custom.url });
          }
        }
        if (providersArr.length > 0) {
          await installer.generateMultiProviderConfig(providersArr, config.model || null, config.router || null);
        }
      }
      
      // Run installation
      await installer.installLocal(config.registry);
      
      installation.status = 'success';
      this.sendLog('✅ Local installation completed successfully!', 'success');
      this.broadcast({
        type: 'installation-complete',
        status: 'success',
        installation: this.sanitizeInstallation(installation)
      });
    } catch (error) {
      installation.status = 'failed';
      installation.error = error.message;
      this.sendLog(`❌ Installation failed: ${error.message}`, 'error');
      this.broadcast({
        type: 'installation-complete',
        status: 'failed',
        error: error.message,
        installation: this.sanitizeInstallation(installation)
      });
    }
  }

  async handleRemoteInstall(config) {
    const installId = Date.now().toString();
    const installation = {
      id: installId,
      type: 'remote',
      status: 'pending',
      timestamp: new Date().toISOString(),
      config
    };
    
    this.installations.push(installation);
    this.sendLog('☁️ Starting remote installation...', 'info');
    
    try {
      const installer = new ClaudeRemoteInstaller({
        logger: (level, message) => this.sendLog(message, level),
        exitOnFailure: false,
      });
      installer.verbose = config.verbose || false;
      
      // Prepare auth
      const auth = {};
      if (config.password) {
        auth.password = config.password;
      } else if (config.privateKey) {
        auth.privateKey = config.privateKey;
        if (config.passphrase) {
          auth.passphrase = config.passphrase;
        }
      }
      
      // Prepare providers array for multi-provider config
      let providersArr = [];
      
      if (config.providers) {
        const p = config.providers;
        if (Array.isArray(p)) {
          providersArr = p;
        } else {
          if (p.openai?.enabled && p.openai?.apiKey) {
            providersArr.push({ 
              name: 'openai', 
              apiKey: p.openai.apiKey, 
              apiUrl: p.openai.url || 'https://api.openai.com' 
            });
          }
          if (p.ucloud?.enabled && p.ucloud?.apiKey) {
            providersArr.push({ 
              name: 'ucloud', 
              apiKey: p.ucloud.apiKey, 
              apiUrl: p.ucloud.url || 'https://api.modelverse.cn' 
            });
          }
          if (p.custom?.enabled && p.custom?.apiKey && (p.custom.customUrl || p.custom.url)) {
            providersArr.push({ 
              name: 'custom', 
              apiKey: p.custom.apiKey, 
              apiUrl: p.custom.customUrl || p.custom.url 
            });
          }
        }
      }
      
      // Run remote installation with multi-provider support
      await installer.installRemoteWithProviders(
        config.host,
        config.username,
        auth,
        parseInt(config.port || 22),
        config.skipConfig,
        config.registry,
        providersArr,
        config.userInstall,
        config.model || null,
        config.router || null
      );
      
      installation.status = 'success';
      this.sendLog('✅ Remote installation completed successfully!', 'success');
      this.broadcast({
        type: 'installation-complete',
        status: 'success',
        installation: this.sanitizeInstallation(installation)
      });
    } catch (error) {
      installation.status = 'failed';
      installation.error = error.message;
      this.sendLog(`❌ Remote installation failed: ${error.message}`, 'error');
      this.broadcast({
        type: 'installation-complete',
        status: 'failed',
        error: error.message,
        installation: this.sanitizeInstallation(installation)
      });
    }
  }

  async handleGenerateConfig(config) {
    this.sendLog('🔧 Generating multi-provider configuration...', 'info');
    
    try {
      const installer = new LocalInstaller({
        logger: (level, message) => this.sendLog(message, level),
        exitOnFailure: false,
      });
      await installer.generateMultiProviderConfig(config.providers, config.model || null, config.router || null);
      
      const configPath = path.join(os.homedir(), '.claude-code-router', 'config.json');
      
      this.sendLog(`✅ Configuration generated at: ${configPath}`, 'success');
      return configPath;
    } catch (error) {
      this.sendLog(`❌ Configuration generation failed: ${error.message}`, 'error');
      throw error;
    }
  }

  stop() {
    if (this.wss) {
      this.wss.close();
    }
    if (this.server) {
      this.server.close();
    }
    console.log(chalk.yellow('👋 Server stopped'));
  }
}

// Export for use in CLI
module.exports = { UIServer };

// Run directly if called as main module
if (require.main === module) {
  const server = new UIServer(process.env.PORT || 3456);
  server.start().catch(console.error);
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n👋 Shutting down server...'));
    server.stop();
    process.exit(0);
  });
}
