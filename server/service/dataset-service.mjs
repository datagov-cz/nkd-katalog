/**
 * @typedef {{
 * iri: string,
 * title: string,
 * description: string,
 * }} DatasetPreview
 *
 * @typedef {{
 *   fetchDatasetPreviews: (languages: string[], iris: string[]) => Promise<DatasetPreview[]>
 * }} DatasetService
 */

/**
 * @param {import('../data-source/couchdb-dataset.mjs').CouchDbDatasetService} couchDbDataset
 * @returns {DatasetService}
 */
export function createDatasetService(couchDbDataset) {
  return {
    /**
     * Fetch and return preview data for datasets with given IRIs.
     * @param {('cs' | 'en')[]} languages
     * @param {string[]} iris
     * @returns {Promise<DatasetPreview[]>}
     */
    "fetchDatasetPreviews": async (languages, iris) =>
      fetchDatasetPreviews(couchDbDataset, languages, iris),
  }
}

/**
 * @param {*} couchDbDataset
 * @param {('cs' | 'en')[]} languages
 * @param {string[]} iris
 * @returns {Promise<DatasetPreview[]>}
 */
async function fetchDatasetPreviews(couchDbDataset, languages, iris) {
  /** @type DatasetPreview[] */
  const result = [];
  for (const iri of iris) {
    const dataset = await couchDbDataset.fetchDatasetPreview(languages, iri);
    result.push({
      "iri": iri,
      "title": dataset?.title ?? iri,
      "description": dataset?.description ?? "",
    });
  }
  return result;
}
