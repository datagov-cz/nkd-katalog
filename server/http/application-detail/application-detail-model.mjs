/**
 * @param {import('../../service/service.mjs').Services} services
 * @param {string[]} languages
 * @param {{ iri: string }} query
 * @returns {Promise<any>}
 */
export async function prepareData(services, languages, query) {
  const labelService = services.label;
  const data = await services.solrApplication.fetchApplication(languages, query["iri"]);
  if (data === null) {
    return null;
  }
  data["states"] = await irisToResources(labelService, languages, data["states"]);
  data["platforms"] = await irisToResources(labelService, languages, data["platforms"]);
  data["themes"] = await irisToResources(labelService, languages, data["themes"]);
  data["types"] = await irisToResources(labelService, languages, data["types"])
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
