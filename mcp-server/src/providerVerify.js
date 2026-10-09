// Live key verification for the providers the admin dashboard also curates
// (admin/providers.js). Kept deliberately narrow: this module only checks a
// key is accepted by the provider — it does not run agent tasks or spend
// tokens. A provider outside this list can still be recorded (the client key
// registry accepts any provider string); it just can't be verified from here
// yet.

const OPENAI_COMPATIBLE_BASE_URL = {
  groq: "https://api.groq.com/openai/v1",
  deepseek: "https://api.deepseek.com",
};

const KNOWN_PROVIDERS = new Set(["openai", "anthropic", "google", "openrouter", ...Object.keys(OPENAI_COMPATIBLE_BASE_URL)]);

export function isKnownProvider(provider) {
  return KNOWN_PROVIDERS.has(provider);
}

async function providerFetch(url, options) {
  let response;
  try {
    response = await fetch(url, { ...options, signal: AbortSignal.timeout(20_000) });
  } catch (err) {
    throw new Error(err.name === "TimeoutError" || err.name === "AbortError" ? "Request timed out." : err.message);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || data?.error?.status || data?.message || response.statusText;
    throw new Error(`${response.status} ${message}`);
  }
  return data;
}

export async function verifyProviderKey(provider, apiKey) {
  if (provider === "openai") {
    await providerFetch("https://api.openai.com/v1/models", { headers: { Authorization: `Bearer ${apiKey}` } });
  } else if (provider === "anthropic") {
    await providerFetch("https://api.anthropic.com/v1/models?limit=1", { headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" } });
  } else if (provider === "google") {
    await providerFetch(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=1&key=${encodeURIComponent(apiKey)}`, {});
  } else if (provider === "openrouter") {
    // /models is public/unauthenticated on OpenRouter, so it can't verify a
    // key; /key requires auth and returns the key's own status.
    await providerFetch("https://openrouter.ai/api/v1/key", { headers: { Authorization: `Bearer ${apiKey}` } });
  } else if (OPENAI_COMPATIBLE_BASE_URL[provider]) {
    await providerFetch(`${OPENAI_COMPATIBLE_BASE_URL[provider]}/models`, { headers: { Authorization: `Bearer ${apiKey}` } });
  } else {
    throw new Error(`Verification isn't supported for provider "${provider}" yet.`);
  }
  return true;
}
