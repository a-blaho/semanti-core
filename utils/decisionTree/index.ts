import Papa from "papaparse";
import { countries } from "./countries";
import { languages } from "./languages";

export interface ColumnAnalysis {
  header: string;
  dataType: string;
  dataFormat: string;
  confidence: number;
  missingValueRatio: number;
  stats: NumberStats | TextStats | null;
  sampleValues: string[];
}

interface NumberStats {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
}

interface TextStats {
  avgLength: number;
  uniqueRatio: number;
  containsNumbers: boolean;
  containsSpecialChars: boolean;
}

interface RegexPatterns {
  email: RegExp;
  phone: RegExp;
  dateISO: RegExp;
  dateUS: RegExp;
  dateEU: RegExp;
  dateTime: RegExp;
  integer: RegExp;
  decimal: RegExp;
  scientificNotation: RegExp;
  currency: RegExp;
  coordinates: RegExp;
  ipv4: RegExp;
  time: RegExp;
  percentage: RegExp;
  url: RegExp;
  uuid: RegExp;
  [key: string]: RegExp;
}

const headerDataTypeMap: { [key: string]: string } = {
  email: "email",
  date: "date",
  "date of birth": "date",
  dob: "date",
  "phone number": "phone",
  phone: "phone",
  name: "name",
  country: "country",
  language: "language",
  age: "number",
  amount: "currency",
  price: "currency",
};

const countrySet = new Set(countries.map((item) => item.toLowerCase()));
const languageSet = new Set(languages.map((item) => item.toLowerCase()));

const regexPatterns: RegexPatterns = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

  phone: /^(?:\+?\d{1,4}[-.\s]?)?(?:\(?\d{1,}\)?[-.\s]?){1,}(?:\d[-.\s]?){4,}$/,

  dateISO: /^\d{4}-\d{2}-\d{2}$/,
  dateUS: /^\d{1,2}\/\d{1,2}\/\d{4}$/,
  dateEU: /^\d{1,2}\.\d{1,2}\.\d{4}$/,
  dateTime:
    /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?(\.\d{3})?(Z|[+-]\d{2}:?\d{2})?$/,

  integer: /^-?\d+$/,
  decimal: /^-?\d*\.\d+$/,
  scientificNotation: /^-?\d*\.?\d+e[+-]?\d+$/i,

  currency:
    /^[¥$€£]\s*-?\d+(?:,\d{3})*(?:\.\d{2})?|\d+(?:,\d{3})*(?:\.\d{2})?\s*[¥$€£]$/,

  coordinates: /^-?\d+\.\d+,\s*-?\d+\.\d+$/,
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,

  time: /^(?:(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?(?:\.\d{1,3})?|[0-5]?\d:[0-5]\d(?:\.\d{1,3})?)$/,
  percentage: /^-?\d*\.?\d+%$/,

  url: /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
};

function analyzeNumbers(values: number[]): NumberStats {
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

  return {
    mean,
    median,
    stdDev,
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

function analyzeText(values: string[]): TextStats {
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

function calculateConfidence(
  columnData: string[],
  dataType: string,
  dataFormat: string,
  stats: NumberStats | TextStats | null
): number {
  let confidence = 1.0;

  const missingRatio = columnData.filter((v) => !v).length / columnData.length;
  confidence *= 1 - missingRatio;

  if (dataFormat in regexPatterns) {
    const matchRatio =
      columnData.filter((v) => regexPatterns[dataFormat].test(v)).length /
      columnData.length;
    confidence *= matchRatio;
  }

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

function toHumanReadable(text: string): string {
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

function calculateMatchRatio(values: string[], validSet: Set<string>): number {
  if (values.length === 0) return 0;
  const matches = values.filter((v) => validSet.has(v));
  return matches.length / values.length;
}

function analyzeColumn(
  columnData: string[],
  header: string,
  missingThreshold: number = 0.2
): ColumnAnalysis {
  const humanReadableHeader = toHumanReadable(header);

  const totalValues = columnData.length;
  const missingValues = columnData.filter((v) => !v || v.trim() === "").length;
  const missingValueRatio = missingValues / totalValues;

  const sampleValues = columnData
    .filter((v) => v && v.trim() !== "")
    .slice(0, 5);

  if (missingValueRatio > missingThreshold) {
    return {
      header: humanReadableHeader,
      dataType: "unknown",
      dataFormat: "inconclusive",
      confidence: 0,
      missingValueRatio,
      stats: null,
      sampleValues,
    };
  }

  const cleanedData = columnData.filter((v) => v && v.trim() !== "");
  const textStats = analyzeText(cleanedData);

  if (new Set(cleanedData).size <= 2) {
    const booleanLike = new Set([
      "true",
      "false",
      "0",
      "1",
      "yes",
      "no",
      "y",
      "n",
    ]);
    if (cleanedData.every((v) => booleanLike.has(v.toLowerCase()))) {
      return {
        header: humanReadableHeader,
        dataType: "boolean",
        dataFormat: "binary",
        confidence: calculateConfidence(columnData, "boolean", "binary", null),
        missingValueRatio,
        stats: null,
        sampleValues,
      };
    }
  }

  const numbers = cleanedData.map((v) => Number(v)).filter((n) => !isNaN(n));
  if (numbers.length === cleanedData.length) {
    const stats = analyzeNumbers(numbers);
    const isInteger = numbers.every((n) => Number.isInteger(n));

    let format = isInteger ? "integer" : "decimal";
    if (stats.min >= 1900 && stats.max <= 2100) format = "year";
    if (stats.min >= 0 && stats.max <= 1) format = "probability";
    if (isInteger && stats.min >= 0 && stats.max <= 5) format = "rating";

    return {
      header: humanReadableHeader,
      dataType: "number",
      dataFormat: format,
      confidence: calculateConfidence(columnData, "number", format, stats),
      missingValueRatio,
      stats,
      sampleValues,
    };
  }

  const lowercasedData = cleanedData.map((v) => v.toLowerCase());
  const MATCH_THRESHOLD = 0.8;

  const countryMatchRatio = calculateMatchRatio(lowercasedData, countrySet);
  if (countryMatchRatio >= MATCH_THRESHOLD) {
    return {
      header: humanReadableHeader,
      dataType: "string",
      dataFormat: "country",
      confidence:
        calculateConfidence(columnData, "string", "country", textStats) *
        countryMatchRatio,
      missingValueRatio,
      stats: textStats,
      sampleValues,
    };
  }

  const languageMatchRatio = calculateMatchRatio(lowercasedData, languageSet);
  if (languageMatchRatio >= MATCH_THRESHOLD) {
    return {
      header: humanReadableHeader,
      dataType: "string",
      dataFormat: "language",
      confidence:
        calculateConfidence(columnData, "string", "language", textStats) *
        languageMatchRatio,
      missingValueRatio,
      stats: textStats,
      sampleValues,
    };
  }

  for (const [format, regex] of Object.entries(regexPatterns)) {
    const matchRatio =
      cleanedData.filter((v) => regex.test(v)).length / cleanedData.length;
    if (matchRatio >= MATCH_THRESHOLD) {
      return {
        header: humanReadableHeader,
        dataType: "string",
        dataFormat: format,
        confidence:
          calculateConfidence(columnData, "string", format, textStats) *
          matchRatio,
        missingValueRatio,
        stats: textStats,
        sampleValues,
      };
    }
  }

  let format = "text";

  if (textStats.uniqueRatio > 0.9) {
    if (textStats.avgLength > 100) {
      format = "description";
    } else if (textStats.avgLength > 30) {
      format = "title";
    } else if (cleanedData.every((v) => /^[A-Za-z0-9_-]+$/i.test(v))) {
      format = "identifier";
    }
  } else if (textStats.uniqueRatio < 0.1) {
    format = "category";
  }

  return {
    header: humanReadableHeader,
    dataType: "string",
    dataFormat: format,
    confidence: calculateConfidence(columnData, "string", format, textStats),
    missingValueRatio,
    stats: textStats,
    sampleValues,
  };
}

export function detectDataTypes(
  csvData: string,
  missingThreshold: number = 0.2
): ColumnAnalysis[] {
  const parsedData = Papa.parse<string[]>(csvData, {
    header: false,
    skipEmptyLines: true,
  }).data;

  const headers = parsedData[0];
  const rows = parsedData.slice(1);
  const columns = rows[0].map((_, i) => rows.map((row) => row[i]));

  return columns.map((columnData, index) =>
    analyzeColumn(columnData, headers[index], missingThreshold)
  );
}
