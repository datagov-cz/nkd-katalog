import { FOAF, SKOS } from "./shared/vocabulary.ts";

export function createCouchDbStatic(couchDbConnector) {
  return {
    "fetchInitialCache": (languages) =>
      fetchInitialCache(couchDbConnector, languages),
  };
}

const COUCHDB_DATABASE_NAME = "static";

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
    const labels = (item[FOAF.name] ?? item[SKOS.prefLabel] ?? [])
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
