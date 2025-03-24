import { analysisCache } from "./analyze-dataset.post";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const analysisId = query.id as string;

  if (!analysisId) {
    throw createError({
      statusCode: 400,
      message: "Analysis ID is required",
    });
  }

  const analysis = analysisCache.get(analysisId);

  if (!analysis) {
    throw createError({
      statusCode: 404,
      message: "Analysis not found",
    });
  }

  return {
    status: analysis.status,
    result: analysis.result,
    error: analysis.error,
    progress: analysis.progress || "Waiting for analysis to start...",
  };
});
