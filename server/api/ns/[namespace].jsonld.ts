import { readFileSync } from "fs";
import { join } from "path";

export default defineEventHandler(async (event) => {
  // Get the full URL path
  const url = getRequestURL(event);
  // Extract namespace from the path
  const namespace = url.pathname.split("/").pop()?.replace(".jsonld", "");

  console.log("Requested namespace:", namespace);

  if (!namespace || !["ai", "decision-tree"].includes(namespace)) {
    throw createError({
      statusCode: 404,
      statusMessage: `Namespace not found: ${namespace}`,
    });
  }

  const filePath = join(process.cwd(), "public", "ns", `${namespace}.jsonld`);
  console.log("Looking for file at:", filePath);

  try {
    const content = readFileSync(filePath, "utf-8");

    setHeader(event, "Content-Type", "application/ld+json");
    setHeader(event, "Cache-Control", "public, max-age=3600");
    return content;
  } catch (error) {
    console.error("Error reading file:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Error reading namespace file",
    });
  }
});
