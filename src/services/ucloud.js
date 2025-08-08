'use strict';

function fetchUCloudModels(baseUrl, apiKey) {
  const https = require('https');
  const url = new URL(`${baseUrl}/v1/models`);
  const options = {
    hostname: url.hostname,
    port: url.port || 443,
    path: url.pathname,
    method: 'GET',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.data && Array.isArray(response.data)) {
            const models = response.data.map((m) => m.id || m.name).filter(Boolean);
            resolve(models.length > 0 ? models : ['deepseek-chat', 'deepseek-reasoner']);
          } else {
            resolve(['deepseek-chat', 'deepseek-reasoner']);
          }
        } catch {
          resolve(['deepseek-chat', 'deepseek-reasoner']);
        }
      });
    });
    req.on('error', () => resolve(['deepseek-chat', 'deepseek-reasoner']));
    req.setTimeout(5000, () => resolve(['deepseek-chat', 'deepseek-reasoner']));
    req.end();
  });
}

module.exports = { fetchUCloudModels };

