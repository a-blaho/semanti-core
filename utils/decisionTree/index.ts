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
  reasoning: {
    mainReason: string;
    details: string[];
  };
}

interface NumberStats {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  skewness: number;
  modes: number[];
  modeFrequency: number;
  uniqueValueRatio: number;
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
  dateDash: RegExp;
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
  dateDash: /^\d{1,2}-\d{1,2}-\d{4}$/,
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

  // Calculate skewness
  const cubedDiffs = values.map((x) => Math.pow((x - mean) / stdDev, 3));
  const skewness = cubedDiffs.reduce((a, b) => a + b, 0) / values.length;

  // Calculate modes and their frequencies
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

function isCategoricalData(
  values: string[],
  textStats: TextStats
): { isCategorical: boolean; reason: string; subtype?: string } {
  const uniqueValues = new Set(values);
  const uniqueCount = uniqueValues.size;
  const totalCount = values.length;

  // Check for binary values (exactly two unique values)
  if (uniqueCount === 2) {
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
    const isCommonBoolean = values.every((v) =>
      booleanLike.has(v.toLowerCase())
    );

    return {
      isCategorical: true,
      reason: isCommonBoolean
        ? "Common boolean values detected"
        : `Binary values detected: ${Array.from(uniqueValues).join(" / ")}`,
      subtype: "binary",
    };
  }

  // If there are too many unique values relative to total count, it's likely not categorical
  if (uniqueCount > Math.min(50, totalCount * 0.3)) {
    return {
      isCategorical: false,
      reason: "Too many unique values for a category",
    };
  }

  // If there are very few unique values, it might be categorical
  if (uniqueCount <= 5) {
    return {
      isCategorical: true,
      reason: `Small set of distinct values (${uniqueCount} unique values)`,
    };
  }

  // Check if values follow a pattern typical of categorical data
  const allValuesShort = values.every((v) => v.length <= 30);
  const noSpecialChars =
    !textStats.containsSpecialChars ||
    values.every((v) => /^[A-Za-z0-9\s-]+$/i.test(v));
  const consistentCase =
    values.every((v) => v === v.toLowerCase()) ||
    values.every((v) => v === v.toUpperCase());

  const categoricalFeatures = [
    allValuesShort && "all values are short",
    noSpecialChars && "values contain only simple characters",
    consistentCase && "values have consistent casing",
  ].filter(Boolean);

  if (categoricalFeatures.length >= 2) {
    return {
      isCategorical: true,
      reason: `Likely categorical: ${categoricalFeatures.join(", ")}`,
    };
  }

  return {
    isCategorical: false,
    reason: "Does not match categorical patterns",
  };
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

  // Check for ID columns first
  if (/\bid\b/i.test(header)) {
    const cleanedData = columnData.filter((v) => v && v.trim() !== "");
    const textStats = analyzeText(cleanedData);
    const numbers = cleanedData.map((v) => Number(v)).filter((n) => !isNaN(n));
    const isNumeric = numbers.length === cleanedData.length;

    return {
      header: humanReadableHeader,
      dataType: isNumeric ? "number" : "string",
      dataFormat: "identifier",
      confidence: 1.0,
      missingValueRatio,
      stats: textStats,
      sampleValues,
      reasoning: {
        mainReason: "ID column detected from header name",
        details: [
          `Column name contains 'ID'`,
          `Data type: ${isNumeric ? "numeric" : "string"} identifier`,
          `Sample values: ${sampleValues.join(", ")}`,
        ],
      },
    };
  }

  if (missingValueRatio > missingThreshold) {
    return {
      header: humanReadableHeader,
      dataType: "unknown",
      dataFormat: "inconclusive",
      confidence: 0,
      missingValueRatio,
      stats: null,
      sampleValues,
      reasoning: {
        mainReason: "Too many missing values",
        details: [
          `Missing value ratio: ${(missingValueRatio * 100).toFixed(1)}%`,
          `Total values: ${totalValues}`,
          `Missing values: ${missingValues}`,
        ],
      },
    };
  }

  const cleanedData = columnData.filter((v) => v && v.trim() !== "");
  const textStats = analyzeText(cleanedData);

  // Check for numbers before categorical data
  const numbers = cleanedData.map((v) => Number(v)).filter((n) => !isNaN(n));
  if (numbers.length === cleanedData.length) {
    const stats = analyzeNumbers(numbers);
    const isInteger = numbers.every((n) => Number.isInteger(n));

    let format = isInteger ? "integer" : "decimal";
    let mainReason = isInteger
      ? "Integer values detected"
      : "Decimal numbers detected";
    const details = [
      `Range: ${stats.min} to ${stats.max}`,
      `Mean: ${stats.mean.toFixed(2)}`,
      `Median: ${stats.median.toFixed(2)}`,
      `Standard deviation: ${stats.stdDev.toFixed(2)}`,
    ];

    // Special number formats
    if (
      isInteger &&
      stats.min >= 1900 &&
      stats.max <= 2100 &&
      (header.toLowerCase().includes("year") ||
        header.toLowerCase().includes("yr") ||
        header.toLowerCase().includes("date")) &&
      stats.uniqueValueRatio <= 0.5 && // Years often repeat
      Math.abs(stats.skewness) < 2 // Year distributions tend to be less skewed
    ) {
      format = "year";
      mainReason = "Year values detected";
      details.push(
        `Year indicators: range ${stats.min}-${stats.max}, unique ratio=${(
          stats.uniqueValueRatio * 100
        ).toFixed(1)}%`
      );
    } else if (stats.min >= 0 && stats.max <= 1) {
      format = "probability";
      mainReason = "Probability values detected";
    } else if (isInteger && stats.min >= 0 && stats.max <= 5) {
      format = "rating";
      mainReason = "Rating values detected";
    } else if (
      isInteger &&
      stats.min >= 0 &&
      stats.max <= 150 &&
      (header.toLowerCase().includes("age") ||
        header.toLowerCase().includes("years")) &&
      stats.mean >= 18 &&
      stats.mean <= 90 &&
      stats.stdDev <= 30
    ) {
      format = "age";
      mainReason = "Age values detected";
      details.push(
        `Age indicators: header contains 'age'/'years', mean=${stats.mean.toFixed(
          1
        )}, std=${stats.stdDev.toFixed(1)}`
      );
    } else if (
      (header.toLowerCase().includes("price") ||
        header.toLowerCase().includes("cost") ||
        header.toLowerCase().includes("amount") ||
        header.toLowerCase().includes("payment")) &&
      stats.min >= 0 &&
      (isInteger ||
        cleanedData.every((v) =>
          v.includes(".") ? v.split(".")[1].length <= 2 : true
        ))
    ) {
      format = "currency";
      mainReason = "Currency values detected";
      details.push(
        `Currency indicators: monetary terms in header, valid decimal places, non-negative values`
      );
    }

    return {
      header: humanReadableHeader,
      dataType: "number",
      dataFormat: format,
      confidence: calculateConfidence(columnData, "number", format, stats),
      missingValueRatio,
      stats,
      sampleValues,
      reasoning: {
        mainReason,
        details,
      },
    };
  }

  // Only check for categorical data if it's not numeric
  const categoricalAnalysis = isCategoricalData(cleanedData, textStats);
  if (categoricalAnalysis.isCategorical) {
    const format = categoricalAnalysis.subtype || "category";
    const uniqueValues = Array.from(new Set(cleanedData));
    return {
      header: humanReadableHeader,
      dataType: format === "binary" ? "boolean" : "string",
      dataFormat: format,
      confidence: calculateConfidence(
        columnData,
        format === "binary" ? "boolean" : "string",
        format,
        null
      ),
      missingValueRatio,
      stats: textStats,
      sampleValues,
      reasoning: {
        mainReason: categoricalAnalysis.reason,
        details: [
          `Total distinct values: ${uniqueValues.length}`,
          `Unique values: ${uniqueValues.slice(0, 5).join(", ")}${
            uniqueValues.length > 5 ? "..." : ""
          }`,
        ],
      },
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
      reasoning: {
        mainReason: "Country names detected",
        details: [
          `Match ratio: ${(countryMatchRatio * 100).toFixed(1)}%`,
          `Sample matches: ${sampleValues.join(", ")}`,
        ],
      },
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
      reasoning: {
        mainReason: "Language names detected",
        details: [
          `Match ratio: ${(languageMatchRatio * 100).toFixed(1)}%`,
          `Sample matches: ${sampleValues.join(", ")}`,
        ],
      },
    };
  }

  const orderedPatternChecks = [
    {
      format: "date",
      patterns: ["dateISO", "dateTime", "dateUS", "dateEU", "dateDash"],
    },
    {
      format: "time",
      patterns: ["time"],
    },
    {
      format: "email",
      patterns: ["email"],
    },
    {
      format: "phone",
      patterns: ["phone"],
    },
    {
      format: "currency",
      patterns: ["currency"],
    },
    {
      format: "percentage",
      patterns: ["percentage"],
    },
    {
      format: "coordinates",
      patterns: ["coordinates"],
    },
    {
      format: "ipv4",
      patterns: ["ipv4"],
    },
    {
      format: "url",
      patterns: ["url"],
    },
    {
      format: "uuid",
      patterns: ["uuid"],
    },
    {
      format: "number",
      patterns: ["integer", "decimal", "scientificNotation"],
    },
  ];

  for (const check of orderedPatternChecks) {
    const matchCount = cleanedData.filter((v) =>
      check.patterns.some((pattern) => regexPatterns[pattern].test(v))
    ).length;
    const matchRatio = matchCount / cleanedData.length;

    if (matchRatio >= MATCH_THRESHOLD) {
      const matchedPatterns = check.patterns.filter((pattern) =>
        cleanedData.some((v) => regexPatterns[pattern].test(v))
      );
      return {
        header: humanReadableHeader,
        dataType: "string",
        dataFormat: check.format,
        confidence:
          calculateConfidence(columnData, "string", check.format, textStats) *
          matchRatio,
        missingValueRatio,
        stats: textStats,
        sampleValues,
        reasoning: {
          mainReason: `${
            check.format.charAt(0).toUpperCase() + check.format.slice(1)
          } format detected`,
          details: [
            `Match ratio: ${(matchRatio * 100).toFixed(1)}%`,
            `Matched patterns: ${matchedPatterns.join(", ")}`,
            `Sample values: ${sampleValues.join(", ")}`,
          ],
        },
      };
    }
  }

  let format = "text";
  let mainReason = "General text detected";
  let details = [
    `Uniqueness: ${(textStats.uniqueRatio * 100).toFixed(1)}%`,
    `Average length: ${Math.round(textStats.avgLength)} characters`,
    `Contains numbers: ${textStats.containsNumbers ? "Yes" : "No"}`,
    `Contains special characters: ${
      textStats.containsSpecialChars ? "Yes" : "No"
    }`,
  ];

  if (textStats.uniqueRatio > 0.9) {
    if (textStats.avgLength > 100) {
      format = "description";
      mainReason = "Long descriptive text detected";
    } else if (textStats.avgLength > 30) {
      format = "title";
      mainReason = "Title-like text detected";
    } else if (cleanedData.every((v) => /^[A-Za-z0-9_-]+$/i.test(v))) {
      format = "identifier";
      mainReason = "Identifier pattern detected";
    }
  } else if (textStats.uniqueRatio < 0.3) {
    const categoricalAnalysis = isCategoricalData(cleanedData, textStats);
    if (categoricalAnalysis.isCategorical) {
      format = "category";
      mainReason = "Categorical data detected";
      details = [
        ...details,
        `Reason: ${categoricalAnalysis.reason}`,
        `Unique values: ${Array.from(new Set(cleanedData))
          .slice(0, 5)
          .join(", ")}${new Set(cleanedData).size > 5 ? "..." : ""}`,
      ];
    }
  }

  return {
    header: humanReadableHeader,
    dataType: "string",
    dataFormat: format,
    confidence: calculateConfidence(columnData, "string", format, textStats),
    missingValueRatio,
    stats: textStats,
    sampleValues,
    reasoning: {
      mainReason,
      details,
    },
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
