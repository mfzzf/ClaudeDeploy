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
  return (models || []).filter((model) => {
    const s = String(model || '').toLowerCase();
    const excludedKeywords = ['flux', 'text-to-image', 'multi', 'image', 'edit', 'vl'];
    const includedVendors = ['deepseek', 'zai-org', 'moonshotai', 'glm', 'ernie', 'baidu', 'openai', 'qwen'];
    const isExcluded = excludedKeywords.some((k) => s.includes(k));
    const isIncluded = includedVendors.some((k) => s.includes(k));
    return !isExcluded && isIncluded;
  });
}

module.exports = { validateRegistryUrl, filterChatModels };

