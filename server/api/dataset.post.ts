import { serverSupabaseClient } from "#supabase/server";
import { randomUUID } from "crypto";
import { Database } from "~/database.types";

export default defineEventHandler(async (event) => {
  const [{ storage }, client, user] = await Promise.all([
    serverSupabaseClient(event),
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

  const { error: datasetStorageError } = await storage
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

  const metadataFile = {
    "@context": "http://www.w3.org/ns/csvw",
    url: `${datasetId}.csv`,
    "dc:title": metadata.name,
    "dc:description": metadata.description,
    tableSchema: {
      columns: metadata.columns.map((column: any) => ({
        titles: column.title,
        "dc:title": column.name,
        "dc:description": column.description,
        datatype: column.dataType,
      })),
    },
  };

  const { error: metadataStorageError } = await storage
    .from("datasets")
    .upload(
      `${datasetId}/${datasetId}.csv-metadata.json`,
      JSON.stringify(metadataFile),
      { contentType: "application/csvm+json" }
    );

  if (metadataStorageError) {
    await storage.from("datasets").remove([datasetId]);

    throw createError({
      statusCode: 500,
      statusMessage: metadataStorageError.message,
    });
  }

  const { error: databaseError } = await client.from("datasets").insert({
    id: datasetId,
    name: dataset.filename?.split(".")[0] ?? "Dataset",
    owner: user.id,
    public: metadata.public,
  });

  if (databaseError) {
    await storage.from("datasets").remove([datasetId]);

    throw createError({
      statusCode: 500,
      statusMessage: databaseError.message,
    });
  }

  setResponseStatus(event, 201);

  return {
    statusMessage: "Dataset created",
  };
});
