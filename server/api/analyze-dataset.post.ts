import { OpenAI } from "openai";

interface ColumnMetadata {
  name: string;
  description: string;
  dataType: string;
  category: string;
  confidence: number;
  reasoning: {
    mainReason: string;
    details: string[];
  };
}

interface DatasetMetadata {
  name: string;
  description: string;
  columns: ColumnMetadata[];
}

// Simple in-memory store for analysis results
export const analysisStore = new Map<
  string,
  {
    status: "analyzing" | "complete" | "error";
    progress: number; // 0 to 100
    result?: DatasetMetadata;
    error?: string;
    lastUpdated: number;
  }
>();

// Cleanup old entries every hour
setInterval(() => {
  const oneHourAgo = Date.now() - 3600000;
  for (const [key, value] of analysisStore.entries()) {
    if (value.lastUpdated < oneHourAgo) {
      analysisStore.delete(key);
    }
  }
}, 3600000);

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig();
  const openai = new OpenAI({
    apiKey: runtimeConfig.openaiApiKey,
    maxRetries: 2,
    timeout: 30000,
  });

  const body = await readBody(event);
  const { fileName, sampleData, columnAnalysis } = body;

  // Basic input validation
  if (!Array.isArray(columnAnalysis) || columnAnalysis.length === 0) {
    throw createError({
      statusCode: 400,
      message: "Invalid input: columnAnalysis must be a non-empty array",
    });
  }

  if (!Array.isArray(sampleData) || sampleData.length < 2) {
    throw createError({
      statusCode: 400,
      message:
        "Invalid input: sampleData must contain at least 2 rows (header + data)",
    });
  }

  // Generate analysis ID
  const analysisId = `${Date.now()}-${Math.random().toString(36).substring(2)}`;

  // Initialize analysis in store
  analysisStore.set(analysisId, {
    status: "analyzing",
    progress: 0,
    lastUpdated: Date.now(),
  });

  // Start analysis in background
  analyzeDataset(analysisId);

  // Return ID immediately
  return { analysisId };

  async function analyzeDataset(id: string) {
    try {
      // Analyze columns one by one
      const analyzedColumns: ColumnMetadata[] = [];
      const totalColumns = columnAnalysis.length;

      for (let i = 0; i < totalColumns; i++) {
        const col = columnAnalysis[i];
        const sampleValues = sampleData
          .slice(1, 6)
          .map((row: string[]) => row[i]);

        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
              {
                role: "system",
                content: `You are a data scientist analyzing a single column from a dataset. 
Analyze the column data and provide:
1. A clear, descriptive name (max 30 chars)
2. A brief description (max 100 chars)
3. The data type and format
4. Confidence score (0-1)
5. Reasoning for the classification

Use ONLY these data types:
- "string" (text)
- "number" (numeric)
- "boolean" (true/false)
- "date" (dates)
- "unknown" (unclear)

For numbers, use these formats:
- "integer" (whole numbers)
- "decimal" (floating point)
- "year" (1900-2100)
- "age" (0-150)
- "rating" (0-5)
- "probability" (0-1)

For strings, use these formats:
- "text" (general text)
- "category" (categorical)
- "binary" (two values)
- "identifier" (unique IDs)
- "email" (emails)
- "phone" (phone numbers)
- "date" (dates)
- "time" (times)
- "currency" (money)
- "percentage" (percentages)
- "coordinates" (geo coords)
- "country" (countries)
- "language" (languages)
- "ipv4" (IP addresses)
- "url" (URLs)
- "uuid" (UUIDs)
- "description" (>100 chars)
- "title" (30-100 chars)

For unclear data:
- "inconclusive"`,
              },
              {
                role: "user",
                content: `Analyze this column from "${fileName}":

Header: ${col.header}
Sample values: ${sampleValues.join(", ")}
Initially detected type: ${col.dataType}
Initially detected format: ${col.dataFormat}
Initial confidence: ${col.confidence}
Initial reasoning: ${JSON.stringify(col.reasoning)}

Respond with a JSON object matching this type:
{
  name: string;      // max 30 chars
  description: string;  // max 100 chars
  dataType: string;    // from allowed types
  category: string;    // from allowed formats
  confidence: number;  // 0 to 1
  reasoning: {
    mainReason: string;
    details: string[];
  }
}`,
              },
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
          });

          if (!completion?.choices?.[0]?.message?.content) {
            throw new Error("Empty response from OpenAI");
          }

          const columnMetadata = JSON.parse(
            completion.choices[0].message.content
          ) as ColumnMetadata;
          analyzedColumns.push(columnMetadata);

          // Update progress
          const progress = Math.round(
            (analyzedColumns.length / totalColumns) * 100
          );
          analysisStore.set(id, {
            status: "analyzing",
            progress,
            lastUpdated: Date.now(),
          });
        } catch (error) {
          console.error(`Error analyzing column ${i} (${col.header}):`, error);
          throw new Error(
            `Failed to analyze column "${col.header}": ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      // Generate dataset-level metadata
      const dataTypes = new Set(analyzedColumns.map((col) => col.dataType));

      // Generate name and description using OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `You are a data scientist naming and describing a dataset.
Generate a concise name (max 50 chars) and description (max 200 chars) based on the column information.
The name should be clear and professional, avoiding technical jargon.
The description should highlight the key aspects and potential use cases of the dataset.

Respond with a JSON object:
{
  "name": string,    // Dataset name (don't include the word 'Dataset')
  "description": string  // Brief description
}`,
          },
          {
            role: "user",
            content: `Analyze these columns from "${fileName}":

${analyzedColumns.map((col) => `- ${col.name}: ${col.description} (${col.dataType}, ${col.category})`).join("\n")}

Total rows: ${sampleData.length - 1}
Data types: ${Array.from(dataTypes).join(", ")}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      if (!completion?.choices?.[0]?.message?.content) {
        throw new Error("Empty response from OpenAI");
      }

      const nameDesc = JSON.parse(completion.choices[0].message.content);

      const metadata: DatasetMetadata = {
        name: `${nameDesc.name} Dataset`,
        description: nameDesc.description,
        columns: analyzedColumns,
      };

      // Store final result
      analysisStore.set(id, {
        status: "complete",
        progress: 100,
        result: metadata,
        lastUpdated: Date.now(),
      });
    } catch (error) {
      console.error("Analysis failed:", error);
      analysisStore.set(id, {
        status: "error",
        progress: 0,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        lastUpdated: Date.now(),
      });
    }
  }

  function formatDatasetName(fileName: string): string {
    // Remove file extension and split by underscores or hyphens
    const baseName = fileName.split(".")[0].replace(/[_-]/g, " ");

    // Capitalize each word
    const formattedName = baseName
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    return `${formattedName} Dataset`;
  }
});
