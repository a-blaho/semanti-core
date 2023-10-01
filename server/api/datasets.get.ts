import { serverSupabaseClient } from "#supabase/server";
import { Database } from "~/database.types";
import { toMetadata } from "../utils/mapMetadata";

export default defineEventHandler(async (event) => {
  const [client, _] = await Promise.all([
    serverSupabaseClient<Database>(event),
    getUser(event),
  ]);

  const query = getQuery(event);
  const { data: datasets, error } = await client
    .from("datasets")
    .select("id, name, metadata, owner ( name )")
    .eq("id", query.id!);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  setResponseStatus(event, 200);

  return datasets.map((dataset) => ({
    ...dataset,
    metadata: toMetadata(dataset.metadata),
  }));
});
