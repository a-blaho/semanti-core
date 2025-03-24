import OpenAI from "openai";
import type { ChatCompletion } from "openai/resources";
import type { ColumnAnalysis } from "~/utils/decisionTree";

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

// In-memory cache for analysis results
export const analysisCache = new Map<
  string,
  {
    status: "pending" | "completed" | "error";
    result?: DatasetMetadata;
    error?: string;
    timestamp: number;
    progress?: string;
  }
>();

// Clean up old cache entries every hour
setInterval(() => {
  const oneHourAgo = Date.now() - 3600000;
  for (const [key, value] of analysisCache.entries()) {
    if (value.timestamp < oneHourAgo) {
      analysisCache.delete(key);
    }
  }
}, 3600000);

export default defineEventHandler(async (event) => {
  console.log("Starting dataset analysis...");

  const runtimeConfig = useRuntimeConfig();
  const openai = new OpenAI({
    apiKey: runtimeConfig.openaiApiKey,
    timeout: 30000, // 30 second timeout for initial connection
  });

  const body = await readBody(event);
  const { fileName, sampleData, columnAnalysis } = body;

  // Generate a unique ID for this analysis
  const analysisId =
    Math.random().toString(36).substring(2) + Date.now().toString(36);

  // Store initial state in cache
  analysisCache.set(analysisId, {
    status: "pending",
    timestamp: Date.now(),
    progress: "Starting analysis...",
  });

  // Start the analysis in the background
  analyzeDataset();

  // Return immediately with the analysis ID
  return { analysisId };

  async function analyzeDataset() {
    try {
      // Update progress
      analysisCache.set(analysisId, {
        ...analysisCache.get(analysisId)!,
        progress: "Preparing data for analysis...",
      });

      const columnInfo = columnAnalysis.map(
        (col: ColumnAnalysis, idx: number) => ({
          header: col.header,
          sampleValues: sampleData.slice(1, 6).map((row: string[]) => row[idx]),
          detectedType: col.dataType,
          detectedFormat: col.dataFormat,
          confidence: col.confidence,
          reasoning: col.reasoning,
        })
      );

      const systemPrompt = `You are a data scientist assistant helping to analyze and describe datasets.
Your task is to:
1. Generate a descriptive name for the dataset based on its contents (max 50 characters)
2. Write a concise description of what the dataset contains and what it could be used for (max 250 characters)
3. For each column:
   - Generate a clear name (max 30 characters)
   - Write a brief description (max 100 characters)
   - Verify and potentially correct the detected data type and format
   - Provide a confidence score and reasoning for the data type decision
4. Ensure all descriptions are professional, accurate, and within the character limits

You MUST use ONLY the following data types:
- "string" (for text)
- "number" (for numeric values)
- "boolean" (for binary/boolean values)
- "date" (for dates)
- "unknown" (when type cannot be determined)

You MUST use ONLY the following formats:
For numbers:
- "integer" (whole numbers)
- "decimal" (floating point)
- "year" (between 1900-2100)
- "age" (0-150)
- "rating" (0-5)
- "probability" (0-1)

For strings:
- "text" (general text)
- "category" (categorical data)
- "binary" (exactly two possible values)
- "identifier" (unique identifiers)
- "email" (email addresses)
- "phone" (phone numbers)
- "date" (dates in various formats)
- "time" (time values)
- "currency" (monetary values)
- "percentage" (percentage values)
- "coordinates" (geographic coordinates)
- "country" (country names)
- "language" (language names)
- "ipv4" (IP addresses)
- "url" (web URLs)
- "uuid" (UUIDs)
- "description" (long text > 100 chars)
- "title" (medium text 30-100 chars)

For unknown/invalid data:
- "inconclusive" (when format cannot be determined)`;

      const userPrompt = `I have a dataset with the following characteristics:
Original filename: ${fileName}

Sample data (first 5 rows):
${sampleData
  .slice(0, 6)
  .map((row: string[]) => row.join(", "))
  .join("\n")}

Column analysis:
${JSON.stringify(columnInfo, null, 2)}

Please analyze this dataset and provide:
1. A clear, descriptive name for the dataset (max 50 characters)
2. A concise description of the dataset (max 250 characters)
3. For each column, provide:
   - A clear, descriptive name (max 30 characters)
   - A brief description of what the column represents (max 100 characters)
   - Verify the data type and format, suggesting corrections if needed
   - A confidence score (0-1) for the data type decision
   - Clear reasoning for the data type decision

Format your response as JSON matching this TypeScript type:
{
  name: string;  // max 50 chars
  description: string;  // max 250 chars
  columns: Array<{
    name: string;  // max 30 chars
    description: string;  // max 100 chars
    dataType: string;
    category: string;
    confidence: number;
    reasoning: {
      mainReason: string;
      details: string[];
    }
  }>;
}`;

      // Update progress
      analysisCache.set(analysisId, {
        ...analysisCache.get(analysisId)!,
        progress: "Sending request to OpenAI...",
      });

      // Maximum number of retries for OpenAI API
      const maxRetries = 2;
      let retryCount = 0;
      let lastError: Error | null = null;

      while (retryCount <= maxRetries) {
        try {
          // Create a timeout promise - 90 seconds total, giving more time for retries
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error("Request timed out after 90 seconds"));
            }, 90000);
          });

          // Create the OpenAI API call promise with a 60 second timeout
          const openai = new OpenAI({
            apiKey: runtimeConfig.openaiApiKey,
            timeout: 60000, // 60 second timeout for initial connection
          });

          const openaiPromise = openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
          });

          // Update progress with retry information if applicable
          if (retryCount > 0) {
            analysisCache.set(analysisId, {
              ...analysisCache.get(analysisId)!,
              progress: `Retry attempt ${retryCount} of ${maxRetries}...`,
            });
          }

          // Race between the API call and timeout
          const response = (await Promise.race([
            openaiPromise,
            timeoutPromise,
          ])) as ChatCompletion;

          if (!response?.choices?.[0]?.message?.content) {
            throw new Error("OpenAI API returned empty response");
          }

          // Update progress
          analysisCache.set(analysisId, {
            ...analysisCache.get(analysisId)!,
            progress: "Processing response...",
          });

          const metadata = JSON.parse(
            response.choices[0].message.content
          ) as DatasetMetadata;

          // Store the result in cache
          analysisCache.set(analysisId, {
            status: "completed",
            result: metadata,
            timestamp: Date.now(),
            progress: "Analysis complete",
          });

          // Success - exit the retry loop
          return;
        } catch (error) {
          lastError =
            error instanceof Error ? error : new Error("Unknown error");
          console.error(`Attempt ${retryCount + 1} failed:`, lastError);

          // If we've exhausted all retries, throw the last error
          if (retryCount === maxRetries) {
            throw lastError;
          }

          // Update progress with retry information
          analysisCache.set(analysisId, {
            ...analysisCache.get(analysisId)!,
            progress: `Attempt failed. Retrying in 5 seconds... (${retryCount + 1}/${maxRetries})`,
          });

          // Wait 5 seconds before retrying
          await new Promise((resolve) => setTimeout(resolve, 5000));
          retryCount++;
        }
      }
    } catch (error) {
      console.error("Error in dataset analysis:", error);

      // Store the error in cache with more detailed message
      const errorMessage =
        error instanceof Error ? error.message : "Failed to analyze dataset";

      analysisCache.set(analysisId, {
        status: "error",
        error: errorMessage.includes("timed out")
          ? "Analysis timed out. Please try again with a smaller dataset or fewer columns."
          : `Analysis failed: ${errorMessage}`,
        timestamp: Date.now(),
        progress: "Analysis failed",
      });
    }
  }
});
