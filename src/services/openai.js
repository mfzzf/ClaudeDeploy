'use strict';

function fetchOpenAIModels(baseUrl, apiKey) {
  const url = new URL(`${baseUrl}/v1/models`);
  const isHttps = url.protocol === 'https:';
  const httpModule = isHttps ? require('https') : require('http');
  const defaultPort = isHttps ? 443 : 80;
  const options = {
    hostname: url.hostname,
    port: url.port || defaultPort,
    path: url.pathname + url.search,
    method: 'GET',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  };

  return new Promise((resolve) => {
    const req = httpModule.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.data && Array.isArray(response.data)) {
            const models = response.data
              .filter(m => m.id && m.id.includes('gpt'))
              .map(m => m.id)
              .filter(Boolean);
            resolve(models.length > 0 ? models : ['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo']);
          } else {
            resolve(['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo']);
          }
        } catch {
          resolve(['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo']);
        }
      });
    });
    req.on('error', () => resolve(['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo']));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo']);
    });
    req.end();
  });
}

module.exports = { fetchOpenAIModels };
