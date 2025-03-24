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
  columnAnalysis: any[],
  onProgress?: (progress: { status: string; percent: number }) => void
): Promise<any> {
  try {
    // Start the analysis
    const response = await fetch("/api/analyze-dataset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName,
        sampleData,
        columnAnalysis,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to start analysis");
    }

    const { analysisId } = await response.json();

    // Poll for results
    const maxAttempts = 60; // 2 minutes maximum (2s interval)
    let attempts = 0;

    while (attempts < maxAttempts) {
      const statusResponse = await fetch(
        `/api/analyze-dataset-status?id=${analysisId}`
      );

      if (!statusResponse.ok) {
        const error = await statusResponse.json();
        throw new Error(error.message || "Failed to check analysis status");
      }

      const status = await statusResponse.json();

      // Report progress
      if (onProgress) {
        onProgress({
          status: getProgressMessage(status),
          percent: status.progress,
        });
      }

      // Check if complete
      if (status.status === "complete") {
        return status.result;
      }

      // Check for errors
      if (status.status === "error") {
        throw new Error(status.error || "Analysis failed");
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, 2000));
      attempts++;
    }

    throw new Error("Analysis timed out after 2 minutes");
  } catch (error) {
    console.error("Dataset analysis failed:", error);
    throw error;
  }
}

function getProgressMessage(status: {
  status: string;
  progress: number;
}): string {
  switch (status.status) {
    case "analyzing":
      return `Analyzing dataset (${status.progress}% complete)...`;
    case "complete":
      return "Analysis complete!";
    case "error":
      return "Analysis failed";
    default:
      return "Waiting for analysis to start...";
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
