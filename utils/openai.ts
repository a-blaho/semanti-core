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
  columnAnalysis: ColumnAnalysis[],
  onProgress?: (message: string) => void
): Promise<DatasetMetadata> {
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
      throw new Error("Failed to start analysis");
    }

    const { analysisId } = await response.json();
    if (!analysisId) {
      throw new Error("No analysis ID returned");
    }

    // Poll for results with extended duration
    // Server has 3 attempts × (60s timeout + 5s delay) + 5s buffer = 200s total
    let attempts = 0;
    const pollInterval = 10000; // 10 seconds
    const maxAttempts = 20; // 200 seconds total (10s interval × 20 attempts)
    let lastProgress = "";

    while (attempts < maxAttempts) {
      const statusResponse = await fetch(
        `/api/analyze-dataset-status?id=${analysisId}`
      );
      if (!statusResponse.ok) {
        throw new Error("Failed to check analysis status");
      }

      const status = await statusResponse.json();

      // Report progress if callback is provided and progress has changed
      if (onProgress && status.progress && status.progress !== lastProgress) {
        onProgress(status.progress);
        lastProgress = status.progress;
      }

      if (status.status === "completed" && status.result) {
        return status.result;
      }

      if (status.status === "error") {
        throw new Error(status.error || "Analysis failed");
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
      attempts++;

      // Update progress with remaining time
      if (onProgress && attempts % 3 === 0) {
        // Show remaining time every 30 seconds (3 × 10s)
        const remainingSeconds = Math.floor(
          (maxAttempts - attempts) * (pollInterval / 1000)
        );
        onProgress(
          `Still processing... Will timeout in ${remainingSeconds} seconds`
        );
      }
    }

    throw new Error(
      "Analysis timed out after 200 seconds. The dataset might be too large to process."
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Analysis failed: ${error.message}`);
    }
    throw new Error("Analysis failed with an unknown error");
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
