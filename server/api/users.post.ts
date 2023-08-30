import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";
import { Database } from "../../database.types";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);
  const user = await serverSupabaseUser(event);

  if (!user || !user.email) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const response = await client.from("users").upsert(
    {
      id: user.id,
      email: user.email,
      name: user.email?.split("@")[0],
    },
    { ignoreDuplicates: true }
  );

  if (response.error) {
    throw createError({
      statusCode: response.status,
      statusMessage: response.statusText,
    });
  }

  setResponseStatus(event, 201);

  return {
    statusMessage: response.statusText,
  };
});
