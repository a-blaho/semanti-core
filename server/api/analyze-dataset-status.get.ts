import { analysisStore } from "./analyze-dataset.post";

export default defineEventHandler((event) => {
  const query = getQuery(event);
  const analysisId = query.id as string;

  if (!analysisId) {
    throw createError({
      statusCode: 400,
      message: "Missing analysis ID",
    });
  }

  const analysis = analysisStore.get(analysisId);
  if (!analysis) {
    throw createError({
      statusCode: 404,
      message: "Analysis not found. It may have expired (TTL: 1 hour)",
    });
  }

  return {
    status: analysis.status,
    progress: analysis.progress,
    result: analysis.result,
    error: analysis.error,
  };
});
