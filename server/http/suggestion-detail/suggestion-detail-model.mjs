/**
 * @param {import('../../service/service.mjs').Services} services
 * @param {string[]} languages
 * @param {{ iri: string }} query
 * @returns {Promise<any>}
 */
export async function prepareData(services, languages, query) {
  const labelService = services.label;
  const data = await services.solrSuggestion.fetchSuggestion(query["iri"]);
  if (data === null) {
    return null;
  }
  data["themes"] = await irisToResources(labelService, languages, data["themes"]);
  data["state"] = await iriToResource(labelService, languages, data["state"]);
  data["datasets"] = await services.dataset.fetchDatasetPreviews(languages, data["datasets"]);
  return data;
};

async function irisToResources(labelService, languages, iris) {
  const result = [];
  for (const iri of (iris ?? [])) {
    result.push(await iriToResource(labelService, languages, iri));
  }
  return result;
}

async function iriToResource(labelService, languages, iri) {
  const labels = await labelService.fetchLabel(languages, iri);
  return {
    "iri": iri,
    "label": labels ?? iri,
  }
}
