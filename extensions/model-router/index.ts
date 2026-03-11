import type { OpenClawPluginApi } from "openclaw/plugin-sdk/core";

type ModelRouterConfig = {
  enabled?: boolean;
  simpleModel?: string;
  complexModel?: string;
  veryComplexModel?: string;
  complexChars?: number;
  veryComplexChars?: number;
  complexKeywords?: string[];
  veryComplexKeywords?: string[];
};

const DEFAULT_CONFIG: Required<
  Pick<
    ModelRouterConfig,
    | "enabled"
    | "simpleModel"
    | "complexModel"
    | "veryComplexModel"
    | "complexChars"
    | "veryComplexChars"
    | "complexKeywords"
    | "veryComplexKeywords"
  >
> = {
  enabled: true,
  simpleModel: "openrouter/anthropic/claude-sonnet-4-6",
  complexModel: "openrouter/anthropic/claude-sonnet-4-6",
  veryComplexModel: "openrouter/anthropic/claude-opus-4-6",
  complexChars: 280,
  veryComplexChars: 700,
  complexKeywords: [
    "analyze",
    "analysis",
    "reason",
    "logic",
    "prove",
    "derive",
    "compare",
    "tradeoff",
    "architecture",
    "design",
    "strategy",
    "optimize",
    "multi-step",
    "step-by-step",
    "evaluate",
  ],
  veryComplexKeywords: [
    "formal proof",
    "optimization",
    "algorithm",
    "multi-agent",
    "systems design",
    "root cause",
    "investigate",
  ],
};

const normalizeStringList = (value?: string[]): string[] =>
  Array.isArray(value)
    ? value.map((entry) => entry.toLowerCase()).filter(Boolean)
    : [];

const normalizeConfig = (raw?: Record<string, unknown>): ModelRouterConfig => ({
  enabled: typeof raw?.enabled === "boolean" ? raw.enabled : undefined,
  simpleModel:
    typeof raw?.simpleModel === "string" ? raw.simpleModel : undefined,
  complexModel:
    typeof raw?.complexModel === "string" ? raw.complexModel : undefined,
  veryComplexModel:
    typeof raw?.veryComplexModel === "string"
      ? raw.veryComplexModel
      : undefined,
  complexChars:
    typeof raw?.complexChars === "number" ? raw.complexChars : undefined,
  veryComplexChars:
    typeof raw?.veryComplexChars === "number"
      ? raw.veryComplexChars
      : undefined,
  complexKeywords: Array.isArray(raw?.complexKeywords)
    ? (raw?.complexKeywords as string[])
    : undefined,
  veryComplexKeywords: Array.isArray(raw?.veryComplexKeywords)
    ? (raw?.veryComplexKeywords as string[])
    : undefined,
});

const resolveConfig = (raw?: Record<string, unknown>) => {
  const cfg = normalizeConfig(raw);
  return {
    enabled: cfg.enabled ?? DEFAULT_CONFIG.enabled,
    simpleModel: cfg.simpleModel ?? DEFAULT_CONFIG.simpleModel,
    complexModel: cfg.complexModel ?? DEFAULT_CONFIG.complexModel,
    veryComplexModel: cfg.veryComplexModel ?? DEFAULT_CONFIG.veryComplexModel,
    complexChars: Math.max(50, cfg.complexChars ?? DEFAULT_CONFIG.complexChars),
    veryComplexChars: Math.max(
      120,
      cfg.veryComplexChars ?? DEFAULT_CONFIG.veryComplexChars,
    ),
    complexKeywords: normalizeStringList(
      cfg.complexKeywords ?? DEFAULT_CONFIG.complexKeywords,
    ),
    veryComplexKeywords: normalizeStringList(
      cfg.veryComplexKeywords ?? DEFAULT_CONFIG.veryComplexKeywords,
    ),
  };
};

const includesKeyword = (prompt: string, keywords: string[]): boolean => {
  if (!keywords.length) {
    return false;
  }
  return keywords.some((keyword) => prompt.includes(keyword));
};

export default function register(api: OpenClawPluginApi) {
  const cfg = resolveConfig(api.pluginConfig);

  api.on(
    "before_model_resolve",
    (event, ctx) => {
      if (!cfg.enabled) {
        return undefined;
      }

      if (ctx?.trigger && ctx.trigger !== "user") {
        return undefined;
      }

      const prompt = (event.prompt || "").trim();
      if (!prompt) {
        return undefined;
      }

      const promptLower = prompt.toLowerCase();
      const isVeryComplex =
        prompt.length >= cfg.veryComplexChars ||
        includesKeyword(promptLower, cfg.veryComplexKeywords);
      const isComplex =
        isVeryComplex ||
        prompt.length >= cfg.complexChars ||
        includesKeyword(promptLower, cfg.complexKeywords);

      const modelOverride = isVeryComplex
        ? cfg.veryComplexModel
        : isComplex
          ? cfg.complexModel
          : cfg.simpleModel;

      if (!modelOverride?.trim()) {
        return undefined;
      }

      return { modelOverride: modelOverride.trim() };
    },
    { priority: 50 },
  );
}
