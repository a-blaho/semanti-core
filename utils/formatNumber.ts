export function formatNumber(number: number): string {
  if (number / 1000000 > 1) {
    return `${(number / 1000000).toFixed(0)}M`;
  } else if (number / 1000 > 1) {
    return `${(number / 1000).toFixed(0)}K`;
  }
  return `${number}`;
}
