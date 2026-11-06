import type { MarketPriority } from "@/content/markets";

/** Цвет метки приоритета рынка — одинаковый в списке и на странице страны. */
export const PRIORITY_TONE: Record<MarketPriority, string> = {
  high: "border-green/40 bg-green/10 text-green",
  mid: "border-blue-soft/40 bg-blue-soft/10 text-blue-soft",
  low: "border-line bg-surface-2 text-muted",
};
