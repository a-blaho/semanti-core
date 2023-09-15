import { serverSupabaseUser } from "#supabase/server";

export async function getUser(event: any) {
  const user = await serverSupabaseUser(event);

  if (!user || !user.email) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  return user;
}
