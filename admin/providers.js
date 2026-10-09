const PROVIDERS = {
  openai: {
    label: "OpenAI",
    models: [
      { id: "gpt-5.6-sol", label: "GPT-5.6 Sol", note: "Frontier reasoning and coding" },
      { id: "gpt-5.6-terra", label: "GPT-5.6 Terra", note: "Balanced intelligence and cost" },
      { id: "gpt-5.6-luna", label: "GPT-5.6 Luna", note: "Fast, cost-sensitive workloads" },
    ],
  },
  anthropic: {
    label: "Anthropic",
    models: [
      { id: "claude-sonnet-5", label: "Claude Sonnet 5", note: "General-purpose agent work" },
      { id: "claude-opus-5", label: "Claude Opus 5", note: "Highest-capability reasoning" },
      { id: "claude-fable-5", label: "Claude Fable 5", note: "Fast everyday work" },
      { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", note: "Stable Sonnet generation" },
      { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5", note: "Low-latency tasks" },
    ],
  },
  google: {
    label: "Google Gemini",
    models: [
      { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash", note: "Agentic and complex workflows" },
      { id: "gemini-3.7-flash", label: "Gemini 3.7 Flash", note: "Previous stable Flash" },
      { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash", note: "General high-throughput work" },
      { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite", note: "Fastest cost-efficient option" },
      { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro Preview", note: "Advanced reasoning preview" },
    ],
  },
  groq: {
    label: "Groq",
    models: [
      { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B", note: "OpenAI's open-weight MoE model, agentic/tool-use focus" },
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile", note: "General-purpose, large context" },
      { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant", note: "Fastest, cost-sensitive workloads" },
      { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B", note: "Long-context mixture-of-experts" },
      { id: "gemma2-9b-it", label: "Gemma 2 9B IT", note: "Lightweight instruction-tuned" },
    ],
  },
  deepseek: {
    label: "DeepSeek",
    models: [
      { id: "deepseek-chat", label: "DeepSeek Chat (V3)", note: "General-purpose chat and coding" },
      { id: "deepseek-reasoner", label: "DeepSeek Reasoner (R1)", note: "Extended chain-of-thought reasoning" },
    ],
  },
  openrouter: {
    label: "OpenRouter",
    models: [
      { id: "openai/gpt-4o", label: "OpenAI GPT-4o (via OpenRouter)", note: "Routed multi-provider access" },
      { id: "anthropic/claude-3.7-sonnet", label: "Claude 3.7 Sonnet (via OpenRouter)", note: "Routed multi-provider access" },
      { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B Instruct (via OpenRouter)", note: "Open-weight, routed" },
      { id: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash (via OpenRouter)", note: "Routed multi-provider access" },
    ],
  },
};

export function providerCatalog() {
  return Object.entries(PROVIDERS).map(([id, provider]) => ({ id, ...provider }));
}

export function providerModel(provider, model) {
  return PROVIDERS[provider]?.models.find((entry) => entry.id === model) ?? null;
}

async function providerFetch(url, options) {
  let response;
  try {
    response = await fetch(url, { ...options, signal: AbortSignal.timeout(45_000) });
  } catch (err) {
    throw Object.assign(new Error(err.name === "TimeoutError" || err.name === "AbortError" ? "Request timed out." : err.message), { transient: true });
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || data?.error?.status || data?.message || response.statusText;
    const transient = response.status === 429 || response.status >= 500;
    throw Object.assign(new Error(`${response.status} ${message}`), { status: response.status, transient });
  }
  return data;
}

// Retries a provider call on rate limits, server errors, and timeouts only —
// never on 4xx auth/validation errors, which won't succeed on retry.
export async function withProviderRetry(fn, { retries = 2, baseDelayMs = 1000 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!err.transient || attempt === retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, baseDelayMs * 2 ** attempt));
    }
  }
  throw lastErr;
}

// OpenAI-compatible providers: same chat-completions request/response shape,
// just a different base URL and (for OpenRouter) a couple of optional
// attribution headers.
const OPENAI_COMPATIBLE = {
  groq: { baseUrl: "https://api.groq.com/openai/v1" },
  deepseek: { baseUrl: "https://api.deepseek.com" },
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1",
    extraHeaders: { "HTTP-Referer": "https://opskeep.dev", "X-Title": "Opskeep admin" },
  },
};

export async function verifyProviderKey(provider, apiKey) {
  if (provider === "openai") {
    await providerFetch("https://api.openai.com/v1/models", { headers: { Authorization: `Bearer ${apiKey}` } });
  } else if (provider === "anthropic") {
    await providerFetch("https://api.anthropic.com/v1/models?limit=1", { headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" } });
  } else if (provider === "google") {
    await providerFetch(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=1&key=${encodeURIComponent(apiKey)}`, {});
  } else if (provider === "openrouter") {
    // /models is public and unauthenticated on OpenRouter, so it can't verify a
    // key; /key requires auth and returns the key's own status.
    await providerFetch("https://openrouter.ai/api/v1/key", { headers: { Authorization: `Bearer ${apiKey}` } });
  } else if (OPENAI_COMPATIBLE[provider]) {
    await providerFetch(`${OPENAI_COMPATIBLE[provider].baseUrl}/models`, { headers: { Authorization: `Bearer ${apiKey}` } });
  } else {
    throw new Error("Unsupported provider.");
  }
  return true;
}

export async function runProvider({ provider, model, apiKey, task }) {
  if (!providerModel(provider, model)) throw new Error("The selected model is not available for this provider.");
  if (provider === "openai") {
    const data = await providerFetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, input: task }),
    });
    const text = data.output_text || (data.output || []).flatMap((item) => item.content || []).filter((item) => item.type === "output_text").map((item) => item.text).join("\n");
    return { text, usage: { inputTokens: data.usage?.input_tokens ?? null, outputTokens: data.usage?.output_tokens ?? null, totalTokens: data.usage?.total_tokens ?? null } };
  }
  if (provider === "anthropic") {
    const data = await providerFetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({ model, max_tokens: 4096, messages: [{ role: "user", content: task }] }),
    });
    return { text: (data.content || []).filter((item) => item.type === "text").map((item) => item.text).join("\n"), usage: { inputTokens: data.usage?.input_tokens ?? null, outputTokens: data.usage?.output_tokens ?? null, totalTokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0) } };
  }
  if (provider === "google") {
    const data = await providerFetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: task }] }] }),
    });
    return { text: (data.candidates?.[0]?.content?.parts || []).map((part) => part.text || "").join("\n"), usage: { inputTokens: data.usageMetadata?.promptTokenCount ?? null, outputTokens: data.usageMetadata?.candidatesTokenCount ?? null, totalTokens: data.usageMetadata?.totalTokenCount ?? null } };
  }
  if (OPENAI_COMPATIBLE[provider]) {
    const { baseUrl, extraHeaders } = OPENAI_COMPATIBLE[provider];
    const data = await providerFetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", ...extraHeaders },
      body: JSON.stringify({ model, messages: [{ role: "user", content: task }] }),
    });
    return {
      text: data.choices?.[0]?.message?.content ?? "",
      usage: { inputTokens: data.usage?.prompt_tokens ?? null, outputTokens: data.usage?.completion_tokens ?? null, totalTokens: data.usage?.total_tokens ?? null },
    };
  }
  throw new Error("Unsupported provider.");
}
