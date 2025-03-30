import type { ColumnAnalysis, NumberStats, TextStats } from "./types";

export function toHumanReadable(text: string): string {
  if (!text) return "";

  let processed = text
    .replace(/[-_\.]+/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/([a-z\d])([A-Z])/g, "$1 $2");

  processed = processed.replace(/\s+/g, " ").trim();

  return processed
    .split(" ")
    .map((word) => {
      if (word.toLowerCase() === "id") return "ID";
      if (word.toUpperCase() === word) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

export function analyzeNumbers(values: number[]): NumberStats {
  const sorted = values.sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;
  const median =
    values.length % 2 === 0
      ? (sorted[values.length / 2 - 1] + sorted[values.length / 2]) / 2
      : sorted[Math.floor(values.length / 2)];

  const squaredDiffs = values.map((x) => Math.pow(x - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(variance);

  const cubedDiffs = values.map((x) => Math.pow((x - mean) / stdDev, 3));
  const skewness = cubedDiffs.reduce((a, b) => a + b, 0) / values.length;

  const freqMap = new Map<number, number>();
  values.forEach((v) => freqMap.set(v, (freqMap.get(v) || 0) + 1));
  const maxFreq = Math.max(...freqMap.values());
  const modes = Array.from(freqMap.entries())
    .filter(([_, freq]) => freq === maxFreq)
    .map(([val, _]) => val);

  return {
    mean,
    median,
    stdDev,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    skewness,
    modes,
    modeFrequency: maxFreq / values.length,
    uniqueValueRatio: freqMap.size / values.length,
  };
}

export function analyzeText(values: string[]): TextStats {
  const lengths = values.map((v) => v.length);
  const avgLength = lengths.reduce((a, b) => a + b, 0) / values.length;
  const uniqueValues = new Set(values);
  const uniqueRatio = uniqueValues.size / values.length;

  const containsNumbers = values.some((v) => /\d/.test(v));
  const containsSpecialChars = values.some((v) => /[^a-zA-Z0-9\s]/.test(v));

  return {
    avgLength,
    uniqueRatio,
    containsNumbers,
    containsSpecialChars,
  };
}

export function calculateConfidence(
  columnData: string[],
  dataType: string,
  dataFormat: string,
  stats: NumberStats | TextStats | null
): number {
  let confidence = 1.0;

  const missingRatio = columnData.filter((v) => !v).length / columnData.length;
  confidence *= 1 - missingRatio;

  if (stats) {
    if ("uniqueRatio" in stats) {
      const textStats = stats as TextStats;
      if (dataFormat === "identifier" && textStats.uniqueRatio > 0.9) {
        confidence *= 1.2;
      }
    } else {
      const numStats = stats as NumberStats;
      if (
        dataFormat === "year" &&
        numStats.min >= 1900 &&
        numStats.max <= 2100
      ) {
        confidence *= 1.2;
      }
    }
  }

  return Math.min(1.0, confidence);
}

export function createAnalysis(
  header: string,
  dataType: string,
  dataFormat: string,
  confidence: number,
  missingValueRatio: number,
  stats: NumberStats | TextStats | null,
  sampleValues: string[],
  mainReason: string,
  details: string[]
): ColumnAnalysis {
  return {
    header: toHumanReadable(header),
    dataType,
    dataFormat,
    confidence,
    missingValueRatio,
    stats,
    sampleValues,
    reasoning: {
      mainReason,
      details,
    },
  };
}
