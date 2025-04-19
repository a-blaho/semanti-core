import { countries } from "./countries";
import { languages } from "./languages";
import type { ColumnAnalysis, ColumnData, DecisionTreeNode } from "./types";
import {
  analyzeNumbers,
  analyzeText,
  calculateConfidence,
  createAnalysis,
} from "./utils";

const countrySet = new Set(countries.map((item) => item.toLowerCase()));
const languageSet = new Set(languages.map((item) => item.toLowerCase()));

interface RegexPattern {
  name: string;
  patterns: RegExp[];
}

const regexPatterns: RegexPattern[] = [
  {
    name: "date",
    patterns: [
      /^\d{4}-\d{2}-\d{2}$/, // ISO
      /^\d{1,2}\/\d{1,2}\/\d{4}$/, // US
      /^\d{1,2}\.\d{1,2}\.\d{4}$/, // EU
      /^\d{1,2}-\d{1,2}-\d{4}$/, // With dashes
    ],
  },
  {
    name: "datetime",
    patterns: [
      /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?(\.\d{3})?(Z|[+-]\d{2}:?\d{2})?$/,
    ],
  },
  {
    name: "time",
    patterns: [
      /^(?:(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?(?:\.\d{1,3})?|[0-5]?\d:[0-5]\d(?:\.\d{1,3})?)$/,
    ],
  },
  {
    name: "number",
    patterns: [
      /^-?\d+$/, // Integer
      /^-?\d*\.\d+$/, // Decimal
      /^-?\d*\.?\d+e[+-]?\d+$/i, // Scientific notation
      /^-?\d*\.?\d+%$/, // Percentage
    ],
  },
  {
    name: "currency",
    patterns: [
      /^[¥$€£]\s*-?\d+(?:,\d{3})*(?:\.\d{2})?|\d+(?:,\d{3})*(?:\.\d{2})?\s*[¥$€£]$/,
    ],
  },
  {
    name: "email",
    patterns: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/],
  },
  {
    name: "url",
    patterns: [
      /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/,
    ],
  },
  {
    name: "uuid",
    patterns: [
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    ],
  },
  {
    name: "coordinates",
    patterns: [/^-?\d+\.\d+,\s*-?\d+\.\d+$/],
  },
  {
    name: "ipv4",
    patterns: [
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    ],
  },
  {
    name: "phone",
    patterns: [
      /^(?:\+?\d{1,4}[-.\s]?)?(?:\(?\d{1,4}\)?[-.\s]?)*(?:\d[-.\s]?){4,}$/,
    ],
  },
];

function isBinaryData(values: string[]): boolean {
  const uniqueValues = new Set(values.map((v) => v.toLowerCase()));
  if (uniqueValues.size !== 2) return false;

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
  return Array.from(uniqueValues).every((v) => booleanLike.has(v));
}

function isNumericData(values: string[]): boolean {
  return values.every((v) => !isNaN(Number(v)));
}

function isInteger(values: string[]): boolean {
  return values.every((v) => Number.isInteger(Number(v)));
}

function isYear(values: string[], header: string): boolean {
  const numbers = values.map((v) => Number(v));
  const stats = analyzeNumbers(numbers);
  return (
    isInteger(values) &&
    stats.min >= 1900 &&
    stats.max <= 2100 &&
    (header.toLowerCase().includes("year") ||
      header.toLowerCase().includes("yr"))
  );
}

function isAge(values: string[], header: string): boolean {
  const numbers = values.map((v) => Number(v));
  const stats = analyzeNumbers(numbers);
  return (
    isInteger(values) &&
    stats.min >= 0 &&
    stats.max <= 150 &&
    (header.toLowerCase().includes("age") ||
      header.toLowerCase().includes("years"))
  );
}

function isCurrency(values: string[], header: string): boolean {
  const numbers = values.map((v) => Number(v));
  const stats = analyzeNumbers(numbers);
  return (
    stats.min >= 0 &&
    (header.toLowerCase().includes("price") ||
      header.toLowerCase().includes("cost") ||
      header.toLowerCase().includes("amount"))
  );
}

function calculateMatchRatio(values: string[], validSet: Set<string>): number {
  if (values.length === 0) return 0;
  const matches = values.filter((v) => validSet.has(v.toLowerCase()));
  return matches.length / values.length;
}

function checkRegexPatterns(
  values: string[]
): { format: string; matchRatio: number } | null {
  const MATCH_THRESHOLD = 0.8;

  for (const { name, patterns } of regexPatterns) {
    const matchCount = values.filter((v) =>
      patterns.some((pattern) => pattern.test(v))
    ).length;
    const matchRatio = matchCount / values.length;

    if (matchRatio >= MATCH_THRESHOLD) {
      return { format: name, matchRatio };
    }
  }

  return null;
}

function analyzeNumericData(values: string[], header: string): ColumnAnalysis {
  const numbers = values.map((v) => Number(v));
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

  if (isYear(values, header)) {
    format = "year";
    mainReason = "Year values detected";
  } else if (stats.min >= 0 && stats.max <= 1) {
    format = "probability";
    mainReason = "Probability values detected";
  } else if (isInteger && stats.min >= 0 && stats.max <= 5) {
    format = "rating";
    mainReason = "Rating values detected";
  } else if (isAge(values, header)) {
    format = "age";
    mainReason = "Age values detected";
  } else if (isCurrency(values, header)) {
    format = "currency";
    mainReason = "Currency values detected";
  }

  return createAnalysis(
    header,
    "number",
    format,
    calculateConfidence(values, "number", format, stats),
    values.filter((v) => !v).length / values.length,
    stats,
    values.slice(0, 5),
    mainReason,
    details
  );
}

function analyzeTextData(values: string[], header: string): ColumnAnalysis {
  const textStats = analyzeText(values);
  const MATCH_THRESHOLD = 0.8;

  const countryMatchRatio = calculateMatchRatio(values, countrySet);
  if (countryMatchRatio >= MATCH_THRESHOLD) {
    return createAnalysis(
      header,
      "string",
      "country",
      calculateConfidence(values, "string", "country", textStats) *
        countryMatchRatio,
      values.filter((v) => !v).length / values.length,
      textStats,
      values.slice(0, 5),
      "Country names pattern detected",
      [
        `Match ratio: ${(countryMatchRatio * 100).toFixed(1)}%`,
        "Values match known country names",
        "High confidence in country classification",
      ]
    );
  }

  const languageMatchRatio = calculateMatchRatio(values, languageSet);
  if (languageMatchRatio >= MATCH_THRESHOLD) {
    return createAnalysis(
      header,
      "string",
      "language",
      calculateConfidence(values, "string", "language", textStats) *
        languageMatchRatio,
      values.filter((v) => !v).length / values.length,
      textStats,
      values.slice(0, 5),
      "Language names pattern detected",
      [
        `Match ratio: ${(languageMatchRatio * 100).toFixed(1)}%`,
        "Values match known language names",
        "High confidence in language classification",
      ]
    );
  }

  const patternMatch = checkRegexPatterns(values);
  if (patternMatch) {
    return createAnalysis(
      header,
      "string",
      patternMatch.format,
      calculateConfidence(values, "string", patternMatch.format, textStats) *
        patternMatch.matchRatio,
      values.filter((v) => !v).length / values.length,
      textStats,
      values.slice(0, 5),
      `${patternMatch.format.charAt(0).toUpperCase() + patternMatch.format.slice(1)} pattern detected`,
      [
        `Match ratio: ${(patternMatch.matchRatio * 100).toFixed(1)}%`,
        `Values follow ${patternMatch.format} format pattern`,
        "High confidence in pattern classification",
      ]
    );
  }

  // Check for categorical data
  const uniqueValues = new Set(values);
  const uniqueRatio = uniqueValues.size / values.length;
  if (uniqueRatio < 0.3) {
    return createAnalysis(
      header,
      "string",
      "categorical",
      0.9,
      values.filter((v) => !v).length / values.length,
      textStats,
      Array.from(uniqueValues),
      "Categorical data pattern detected",
      [
        `Unique values: ${uniqueValues.size}`,
        `Total values: ${values.length}`,
        `Unique ratio: ${(uniqueRatio * 100).toFixed(1)}%`,
        "Low cardinality indicates categorical nature",
      ]
    );
  }

  let format = "text";
  let mainReason = "General text pattern detected";
  const details = [
    `Uniqueness: ${(textStats.uniqueRatio * 100).toFixed(1)}%`,
    `Average length: ${Math.round(textStats.avgLength)} characters`,
    `Contains numbers: ${textStats.containsNumbers ? "Yes" : "No"}`,
    `Contains special characters: ${textStats.containsSpecialChars ? "Yes" : "No"}`,
  ];

  if (textStats.uniqueRatio > 0.9) {
    if (textStats.avgLength > 100) {
      format = "description";
      mainReason = "Long-form descriptive text pattern detected";
      details.push("High average length indicates descriptive content");
    } else if (textStats.avgLength > 30) {
      format = "title";
      mainReason = "Title-like text pattern detected";
      details.push("Moderate length suggests title format");
    } else if (values.every((v) => /^[A-Za-z0-9_-]+$/i.test(v))) {
      format = "identifier";
      mainReason = "Identifier pattern detected";
      details.push("Consistent alphanumeric format with underscores/dashes");
    }
  }

  return createAnalysis(
    header,
    "string",
    format,
    calculateConfidence(values, "string", format, textStats),
    values.filter((v) => !v).length / values.length,
    textStats,
    values.slice(0, 5),
    mainReason,
    details
  );
}

function analyzeColumnName(
  header: string,
  sampleValues: string[]
): ColumnAnalysis | null {
  if (/\bid\b/i.test(header)) {
    return createAnalysis(
      header,
      "string",
      "identifier",
      calculateConfidence(sampleValues, "string", "identifier", null),
      0,
      null,
      sampleValues.slice(0, 5),
      "Identifier column pattern detected from header",
      [
        'Column name contains "ID"',
        "Pattern-based classification",
        "Common pattern for primary/foreign keys",
      ]
    );
  }

  if (/\b(lat|latitude)\b/i.test(header)) {
    return createAnalysis(
      header,
      "number",
      "latitude",
      calculateConfidence(sampleValues, "number", "decimal", null),
      0,
      null,
      sampleValues.slice(0, 5),
      "Latitude coordinate column pattern detected from header",
      [
        "Column name contains latitude-related terms",
        "Pattern-based classification",
        "Common pattern for geographic coordinates",
      ]
    );
  }

  if (/\b(long|longitude|lng)\b/i.test(header)) {
    return createAnalysis(
      header,
      "number",
      "longitude",
      calculateConfidence(sampleValues, "number", "decimal", null),
      0,
      null,
      sampleValues.slice(0, 5),
      "Longitude coordinate column pattern detected from header",
      [
        "Column name contains longitude-related terms",
        "Pattern-based classification",
        "Common pattern for geographic coordinates",
      ]
    );
  }

  if (/\b(year|yr)\b/i.test(header)) {
    return createAnalysis(
      header,
      "number",
      "year",
      calculateConfidence(sampleValues, "number", "year", null),
      0,
      null,
      sampleValues.slice(0, 5),
      "Year column pattern detected from header",
      [
        "Column name contains year-related terms",
        "Pattern-based classification",
        "Common pattern for temporal data",
      ]
    );
  }

  if (/\b(age|years?)\b/i.test(header)) {
    return createAnalysis(
      header,
      "number",
      "age",
      calculateConfidence(sampleValues, "number", "age", null),
      0,
      null,
      sampleValues.slice(0, 5),
      "Age column pattern detected from header",
      [
        "Column name contains age-related terms",
        "Pattern-based classification",
        "Common pattern for demographic data",
      ]
    );
  }

  if (
    /\b(price|cost|balance|fee|payment|salary|wage|income|revenue|budget)\b/i.test(
      header
    )
  ) {
    return createAnalysis(
      header,
      "number",
      "currency",
      calculateConfidence(sampleValues, "number", "currency", null),
      0,
      null,
      sampleValues.slice(0, 5),
      "Currency column pattern detected from header",
      [
        "Column name contains financial terms",
        "Pattern-based classification",
        "Common pattern for monetary values",
      ]
    );
  }

  return null;
}

export function createDecisionTree(): DecisionTreeNode {
  return {
    condition: (data) => {
      const nameAnalysis = analyzeColumnName(data.header, data.sampleValues);
      return nameAnalysis !== null;
    },
    trueBranch: {
      result: (data) => analyzeColumnName(data.header, data.sampleValues)!,
    },
    falseBranch: {
      condition: (data) => data.missingValueRatio > 0.2,
      trueBranch: {
        result: (data) =>
          createAnalysis(
            data.header,
            "unknown",
            "inconclusive",
            0,
            data.missingValueRatio,
            null,
            data.sampleValues,
            "High proportion of missing values detected",
            [
              `Missing value ratio: ${(data.missingValueRatio * 100).toFixed(1)}%`,
              "Data quality is insufficient for reliable type inference",
            ]
          ),
      },
      falseBranch: {
        condition: (data) => isBinaryData(data.values),
        trueBranch: {
          result: (data) => {
            // Get unique values for binary data
            const uniqueValues = Array.from(new Set(data.values));
            return createAnalysis(
              data.header,
              "boolean",
              "binary",
              calculateConfidence(data.values, "boolean", "binary", null),
              data.missingValueRatio,
              null,
              uniqueValues,
              "Binary categorical values detected",
              [
                "Values are strictly binary (true/false, yes/no, 0/1, y/n)",
                "Pattern-based classification",
              ]
            );
          },
        },
        falseBranch: {
          condition: (data) => isNumericData(data.values),
          trueBranch: {
            condition: (data) => isInteger(data.values),
            trueBranch: {
              condition: (data) => isYear(data.values, data.header),
              trueBranch: {
                result: (data) => analyzeNumericData(data.values, data.header),
              },
              falseBranch: {
                condition: (data) => isAge(data.values, data.header),
                trueBranch: {
                  result: (data) =>
                    analyzeNumericData(data.values, data.header),
                },
                falseBranch: {
                  result: (data) =>
                    analyzeNumericData(data.values, data.header),
                },
              },
            },
            falseBranch: {
              condition: (data) => isCurrency(data.values, data.header),
              trueBranch: {
                result: (data) => analyzeNumericData(data.values, data.header),
              },
              falseBranch: {
                result: (data) => analyzeNumericData(data.values, data.header),
              },
            },
          },
          falseBranch: {
            result: (data) => analyzeTextData(data.values, data.header),
          },
        },
      },
    },
  };
}

export function analyzeColumn(data: ColumnData): ColumnAnalysis {
  const tree = createDecisionTree();
  let currentNode: DecisionTreeNode = tree;

  while (currentNode.condition) {
    currentNode = currentNode.condition(data)
      ? currentNode.trueBranch!
      : currentNode.falseBranch!;
  }

  if (currentNode.result) {
    return typeof currentNode.result === "function"
      ? currentNode.result(data)
      : currentNode.result;
  }

  return createAnalysis(
    data.header,
    "unknown",
    "inconclusive",
    0,
    data.missingValueRatio,
    null,
    data.sampleValues,
    "Data pattern analysis inconclusive",
    [
      "No clear pattern detected in the data",
      "Values do not match any known data type patterns",
      "Insufficient information for type inference",
    ]
  );
}
