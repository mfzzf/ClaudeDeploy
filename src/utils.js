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
    // Exclude image generation, embedding, and other non-chat models
    const excludedKeywords = [
      'flux', 'dall-e', 'image', 'whisper', 'tts', 
      'embedding', 'moderation', 'edit', 'audio',
      'text-to-image', 'img', 'vision', 'vl', 'multi',
      'stable-diffusion', 'midjourney'
    ];
    // Include known chat/completion models
    const includedKeywords = [
      'gpt', 'chat', 'turbo', 'davinci', 'curie', 'babbage', 'ada',
      'claude', 'command', 'completion', 'instruct', 'text',
      'deepseek', 'qwen', 'glm', 'baichuan', 'yi', 'llama',
      'mistral', 'mixtral', 'gemini', 'palm'
    ];
    
    const isExcluded = excludedKeywords.some((k) => s.includes(k));
    const isLikelyChat = includedKeywords.some((k) => s.includes(k));
    
    // Keep if it's likely a chat model and not explicitly excluded
    return !isExcluded && (isLikelyChat || s.includes('3.5') || s.includes('4'));
  });
}

module.exports = { validateRegistryUrl, filterChatModels };

