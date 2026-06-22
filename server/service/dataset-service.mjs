import { createLanguageSelector } from "./language-selector.ts";

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
 * @param {import('../data-source/couchdb-dataset.ts').CouchDbDatasetSource} couchDbDataset
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
  const lang = createLanguageSelector(languages);

  /** @type DatasetPreview[] */
  const result = [];
  for (const iri of iris) {
    const dataset = await couchDbDataset.fetchDatasetPreview(iri);
    if (dataset === null) {
      result.push({iri, title: iri, description: ""});
    } else {
      result.push({
        "iri": iri,
        "title": lang(dataset?.title) ?? iri,
        "description": lang(dataset?.description) ?? "",
      });
    }
  }
  return result;
}
