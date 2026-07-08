export const PROVIDER_ORDER = ["PEA", "MEA"] as const;

export type ProviderKey = (typeof PROVIDER_ORDER)[number];

/**
 * Fixed provider → chart-token assignment. Color follows the entity: PEA and
 * MEA keep the same hue in every chart regardless of which providers are
 * present. chart-1/chart-2 are the CVD-validated pair defined in globals.css.
 */
export const PROVIDER_CHART_COLOR: Record<ProviderKey, string> = {
  PEA: "var(--chart-1)",
  MEA: "var(--chart-2)",
};

export const getProviderColor = (provider: string): string =>
  PROVIDER_CHART_COLOR[provider as ProviderKey] ?? "var(--chart-1)";
