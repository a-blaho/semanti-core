import { serverSupabaseClient } from "#supabase/server";
import { Database } from "~/database.types";
import { toMetadata } from "../utils/mapMetadata";

export default defineEventHandler(async (event) => {
  const [client, _] = await Promise.all([
    serverSupabaseClient<Database>(event),
    getUser(event),
  ]);

  const queryObject = getQuery(event);

  const query = client
    .from("datasets")
    .select("id, name, metadata, public, owner ( name )");

  if (queryObject.id) {
    query.eq("id", queryObject.id);
  }

  if (queryObject.owner) {
    query.eq("owner", queryObject.owner);
  }

  if (queryObject.orderBy && isDatasetColumn(queryObject.orderBy)) {
    query.order(
      queryObject.orderBy,
      queryObject.ascending
        ? { ascending: queryObject.ascending === "true" }
        : undefined
    );
  }

  if (queryObject.limit && typeof queryObject.limit === "number") {
    query.limit(queryObject.limit);
  }

  const { data: datasets, error } = await query;

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

type DatasetColumn = keyof Database["public"]["Tables"]["datasets"]["Row"];

function isDatasetColumn(value: unknown): value is DatasetColumn {
  // TODO: somehow get columns directly from Database
  const columns = [
    "id",
    "name",
    "owner",
    "metadata",
    "created_at",
    "updated_at",
  ];

  return typeof value === "string" && columns.includes(value);
}
