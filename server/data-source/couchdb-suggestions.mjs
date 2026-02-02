import { parseLabelResponse } from "./shared/couchdb-response.mjs";
import { FOAF } from "./shared/vocabulary.ts";

export function createCouchDbSuggestions(couchDbConnector) {
  return {
    /**
     * Returns tuple [language, value].
     */
    "fetchLabel": (languages, iri) =>
      fetchLabel(couchDbConnector, languages, iri),
    "fetchInitialCache": (languages) =>
      fetchInitialCache(couchDbConnector, languages),
  };
}

const COUCHDB_DATABASE_NAME = "suggestion";

async function fetchLabel(couchDbConnector, languages, iri) {
  const response = await couchDbConnector.fetch(
    COUCHDB_DATABASE_NAME, iri);
  return parseLabelResponse(languages, response, FOAF.name);
}

async function fetchInitialCache(couchDbConnector, languages) {
  const response = await couchDbConnector.fetch(
    COUCHDB_DATABASE_NAME, "initial_data_cache");
  return parseInitialDataCacheResponse(response, languages);
}

function parseInitialDataCacheResponse(response, languages) {
  const result = [];
  for (const item of response?.jsonld ?? []) {
    const iri = item["@id"];
    if (iri === undefined) {
      continue;
    }
    const labels = (item[FOAF.name] ?? [])
      .map(item => ({
        "value": item["@value"],
        "language": item["@language"],
      }))
      .filter(item => languages.includes(item.language));
    result.push({
      "iri": iri,
      "labels": labels,
    });
  }
  return result;
}
