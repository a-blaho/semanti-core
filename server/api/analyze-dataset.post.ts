import OpenAI from "openai";
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

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig();
  const openai = new OpenAI({
    apiKey: runtimeConfig.openaiApiKey,
  });

  const body = await readBody(event);
  const { fileName, sampleData, columnAnalysis } = body;

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

  const columnInfo = columnAnalysis.map((col: ColumnAnalysis, idx: number) => ({
    header: col.header,
    sampleValues: sampleData.slice(1, 6).map((row: string[]) => row[idx]),
    detectedType: col.dataType,
    detectedFormat: col.dataFormat,
    confidence: col.confidence,
    reasoning: col.reasoning,
  }));

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

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    if (!response.choices[0].message.content) {
      throw new Error("OpenAI API returned empty response");
    }

    const metadata = JSON.parse(
      response.choices[0].message.content
    ) as DatasetMetadata;
    return metadata;
  } catch (error) {
    throw createError({
      statusCode: 500,
      message:
        error instanceof Error ? error.message : "Failed to analyze dataset",
    });
  }
});
