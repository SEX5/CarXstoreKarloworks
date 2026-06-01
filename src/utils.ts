/**
 * Formats large numbers for display in the UI.
 * Handles Billions (B), Millions (M), and Thousands (K).
 */
export function formatResourceQuantity(value: number): string {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B`;
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString();
}

/**
 * Detailed format for inspect views (e.g. "2.0 Billion")
 */
export function formatResourceQuantityDetailed(value: number, type: 'Silver' | 'Gold'): string {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)} Billion`;
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)} Million`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K ${type}`;
  }
  return value.toLocaleString();
}
