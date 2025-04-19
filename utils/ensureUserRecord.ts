import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/database.types";

/**
 * Ensures that a user record exists in the database for the currently authenticated user.
 * If no record exists, it creates one by calling the /api/users endpoint.
 *
 * @param client The Supabase client instance
 * @returns A promise that resolves when the check/creation is complete
 */
export async function ensureUserRecordExists(
  client: SupabaseClient<Database>
): Promise<void> {
  try {
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return;

    // Check if user record exists
    const { data, error } = await client
      .from("users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    // If no record exists, create it
    if (!data && !error) {
      await createUserRecord();
    }
  } catch (error) {
    console.error("Error checking user record:", error);
  }
}

/**
 * Creates a user record in the database by calling the /api/users endpoint.
 *
 * @returns A promise that resolves when the creation is complete
 */
async function createUserRecord(): Promise<void> {
  try {
    const response = await fetch("/api/users", {
      method: "POST",
    });

    if (!response.ok) {
      console.error("Failed to create user record:", await response.text());
    }
  } catch (error) {
    console.error("Error creating user record:", error);
  }
}
