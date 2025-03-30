import { serverSupabaseClient } from "#supabase/server";
import { randomUUID } from "crypto";
import type { Database } from "~/database.types";

export default defineEventHandler(async (event) => {
  const [client, user] = await Promise.all([
    serverSupabaseClient<Database>(event),
    getUser(event),
  ]);

  const data = await readMultipartFormData(event);

  if (!data || data.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing data",
    });
  }

  const dataset = data[0];
  const metadata = JSON.parse(data[1].data.toString());

  if (dataset.type !== "text/csv") {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid file type",
    });
  }

  const datasetId = randomUUID();

  const { error: datasetStorageError } = await client.storage
    .from("datasets")
    .upload(`${datasetId}/${datasetId}.csv`, dataset.data, {
      contentType: "text/csv",
    });

  if (datasetStorageError) {
    throw createError({
      statusCode: 500,
      statusMessage: datasetStorageError.message,
    });
  }

  const { error: databaseError } = await client.from("datasets").insert({
    id: datasetId,
    name: metadata.name,
    owner: user.id,
    public: metadata.public,
    size: metadata.size,
    metadata: {
      "@context": [
        "http://www.w3.org/ns/csvw",
        {
          "@language": "en",
          ai: "/api/ns/ai.jsonld#",
          dt: "/api/ns/decision-tree.jsonld#",
        },
      ],
      "@type": "TableGroup",
      tables: [
        {
          "@type": "Table",
          url: `${datasetId}.csv`,
          "dc:title": metadata.name,
          "dc:description": metadata.description,
          tableSchema: {
            "@type": "Schema",
            columns: metadata.columns.map((column: any) => ({
              name: column.title.toLowerCase().replace(/\s+/g, "_"),
              titles: column.title,
              "dc:title": column.name,
              "dc:description": column.description,
              datatype: {
                base: column.datatype,
                format: column.category || undefined,
              },
              required: true,
              suppressOutput: false,
              "ai:reasoning": column["ai:reasoning"],
              "dt:reasoning": column["dt:reasoning"],
            })),
            aboutUrl:
              "#{" +
              metadata.columns[0].title.toLowerCase().replace(/\s+/g, "_") +
              "}",
            primaryKey: undefined,
            foreignKeys: [],
          },
          dialect: {
            "@type": "Dialect",
            delimiter: ",",
            encoding: "utf-8",
            header: true,
            headerRowCount: 1,
            trim: false,
            skipBlankRows: true,
            lineTerminators: ["\r\n", "\n"],
            quoteChar: '"',
            doubleQuote: true,
          },
        },
      ],
    },
  });

  if (databaseError) {
    await client.storage.from("datasets").remove([datasetId]);

    throw createError({
      statusCode: 500,
      statusMessage: databaseError.message,
    });
  }

  setResponseStatus(event, 201);

  return {
    statusMessage: "Dataset created",
    id: datasetId,
  };
});
