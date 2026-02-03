export default function createHandler(services) {
  // Create handler.
  return {
    "path": "api/v2/catalog/v1/statistics",
    "handler": (request, reply) => handleRequest(services, request, reply),
  };
}

async function handleRequest(services, request, reply) {
  const language = request.query?.language ?? "cs";
  const responseData = {};
  await Promise.all([
    (async () => {
      const statistics = await services.solrDataset.fetchStatistics(language);
      responseData.numberOfDatasets = statistics.datasetsCount;
      responseData.numberOfKeywords = statistics.keywordsCount;
      responseData.numberOfPublishers = statistics.publishersCount;
      console.log({ responseData });
    })(),
    (async () => {
      responseData.numberOfApplications =
        await services.solrApplication.fetchApplicationsCount();
      console.log({ responseData });
    })(),
  ]);
  reply
    .code(200)
    .header("Content-Type", "application/json; charset=utf-8")
    .send({ "data": responseData });
}
