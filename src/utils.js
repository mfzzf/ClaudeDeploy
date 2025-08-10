'use strict';

function validateRegistryUrl(registry) {
  if (!registry) return null;
  try {
    const u = new URL(registry);
    if (!/^https?:$/.test(u.protocol)) return null;
    return u.toString().replace(/\/$/, '');
  } catch (_) {
    return null;
  }
}

function filterChatModels(models) {
  // 不再过滤任何模型，直接返回全部
  return models || [];
}

module.exports = { validateRegistryUrl, filterChatModels };

