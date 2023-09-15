import { serverSupabaseClient } from "#supabase/server";
import { randomUUID } from "crypto";
import { Database } from "~/database.types";

export default defineEventHandler(async (event) => {
  const [{ storage }, client, user] = await Promise.all([
    serverSupabaseClient(event),
    serverSupabaseClient<Database>(event),
    getUser(event),
  ]);

  const files = await readMultipartFormData(event);

  if (!files || files.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing data",
    });
  }

  const dataset = files[0];
  if (dataset.type !== "text/csv") {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid file type",
    });
  }

  const datasetId = randomUUID();

  const { error: storageError } = await storage
    .from("datasets")
    .upload(datasetId, dataset.data);

  if (storageError) {
    throw createError({
      statusCode: 500,
      statusMessage: storageError.message,
    });
  }

  const { error: databaseError } = await client.from("datasets").insert({
    id: datasetId,
    name: dataset.filename?.split(".")[0] ?? "Dataset",
    owner: user.id,
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
