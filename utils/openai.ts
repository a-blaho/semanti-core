import type { ColumnAnalysis } from "./decisionTree";

interface DatasetMetadata {
  name: string;
  description: string;
  columns: {
    name: string;
    description: string;
    dataType: string;
    category: string;
    confidence: number;
    reasoning: {
      mainReason: string;
      details: string[];
    };
  }[];
}

export async function analyzeDataset(
  fileName: string,
  sampleData: string[][],
  columnAnalysis: ColumnAnalysis[]
): Promise<DatasetMetadata> {
  try {
    const data = await $fetch("/api/analyze-dataset", {
      method: "POST",
      body: {
        fileName,
        sampleData,
        columnAnalysis,
      },
    });
    return data as DatasetMetadata;
  } catch (error) {
    throw new Error((error as Error).message || "Failed to analyze dataset");
  }
}

export async function verifyColumnAnalysis(
  columnAnalysis: ColumnAnalysis,
  sampleData: string[]
): Promise<{
  dataType: string;
  dataFormat: string;
  confidence: number;
  reasoning: { mainReason: string; details: string[] };
}> {
  try {
    const data = await $fetch("/api/verify-column", {
      method: "POST",
      body: {
        columnAnalysis,
        sampleData,
      },
    });
    return data as {
      dataType: string;
      dataFormat: string;
      confidence: number;
      reasoning: { mainReason: string; details: string[] };
    };
  } catch (error) {
    throw new Error((error as Error).message || "Failed to verify column");
  }
}
