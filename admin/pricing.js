// Per-model USD pricing, stored in the shared store (data.pricing) and set by
// the operator from the Pricing view (there is no built-in default table: the
// provider catalog uses forward-looking model names this module has no way to
// verify current rates for, and a wrong fabricated rate would silently
// misbill a client). Until a rate is set for a model, runs on that model stay
// in the existing manual "Complete run" flow. One credit equals one USD; this
// module produces USD, and callers book that amount as credits directly.

const PRICING_VERSION = 1;

export function pricingKey(provider, model) {
  return `${provider}::${model}`;
}

export function ensurePricing(data) {
  if (!data.pricing || typeof data.pricing !== "object" || Array.isArray(data.pricing)) {
    data.pricing = {};
  }
  return data.pricing;
}

export function getModelPricing(data, provider, model) {
  return ensurePricing(data)[pricingKey(provider, model)] ?? null;
}

export function setModelPricing(data, provider, model, { inputPer1M, outputPer1M }) {
  const pricing = ensurePricing(data);
  pricing[pricingKey(provider, model)] = {
    version: PRICING_VERSION,
    provider,
    model,
    inputPer1M,
    outputPer1M,
    updatedAt: new Date().toISOString(),
  };
  return pricing[pricingKey(provider, model)];
}

export function removeModelPricing(data, provider, model) {
  delete ensurePricing(data)[pricingKey(provider, model)];
}

// Returns a USD cost, or null if this model has no rate set yet.
export function computeCostUSD(data, provider, model, usage) {
  const rate = getModelPricing(data, provider, model);
  if (!rate || usage?.inputTokens == null || usage?.outputTokens == null) return null;
  const inputCost = (usage.inputTokens / 1_000_000) * rate.inputPer1M;
  const outputCost = (usage.outputTokens / 1_000_000) * rate.outputPer1M;
  return Math.round((inputCost + outputCost) * 10_000) / 10_000; // 4dp, avoids float noise
}
