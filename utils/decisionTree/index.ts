import Papa from "papaparse";
import { analyzeColumn } from "./tree";
import type { ColumnAnalysis } from "./types";

export type { ColumnAnalysis };

export function detectDataTypes(
  csvData: string,
  missingThreshold: number = 0.2
): ColumnAnalysis[] {
  const parsedData = Papa.parse<string[]>(csvData, {
    header: false,
    skipEmptyLines: true,
    quoteChar: '"',
    escapeChar: '"',
  }).data;

  const headers = parsedData[0];
  const rows = parsedData.slice(1);
  const columns = rows[0].map((_, i) => rows.map((row) => row[i]));

  return columns.map((columnData, index) => {
    const missingValues = columnData.filter(
      (v) => !v || v.trim() === "" || v.trim().toUpperCase() === "NULL"
    ).length;
    const missingValueRatio = missingValues / columnData.length;
    const sampleValues = Array.from(
      new Set(
        columnData.filter(
          (v) => v && v.trim() !== "" && v.trim().toUpperCase() !== "NULL"
        )
      )
    ).slice(0, 5);

    return analyzeColumn({
      header: headers[index],
      values: columnData,
      missingValueRatio,
      sampleValues,
    });
  });
}
