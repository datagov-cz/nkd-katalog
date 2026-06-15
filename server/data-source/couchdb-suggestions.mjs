import { parseLabelResponse } from "./shared/couchdb-response.mjs";
import { FOAF, SKOS } from "./shared/vocabulary.ts";

/**
 * @typedef {{
 *   fetchLabel: (languages: ('cs' | 'en')[], iri: string) => Promise<{[language: string]: string} | null>,
 *   fetchInitialCache: (languages: ('cs' | 'en')[]) => Promise<import('./couchdb-static.mjs').CacheItem[]>
 * }} CouchDbSuggestionsService
 */

/**
 * @param {import('../connector/couchdb.mjs').CouchDbConnector} couchDbConnector
 * @returns {CouchDbSuggestionsService}
 */
export function createCouchDbSuggestions(couchDbConnector) {
  return {
    "fetchLabel": (languages, iri) =>
      fetchLabel(couchDbConnector, languages, iri),
    "fetchInitialCache": (languages) =>
      fetchInitialCache(couchDbConnector, languages),
  };
}

const COUCHDB_DATABASE_NAME = "suggestion";

/**
 * @param {import('../connector/couchdb.mjs').CouchDbConnector} couchDbConnector
 * @param {('cs' | 'en')[]} languages
 * @param {string} iri
 * @returns {Promise<{[language: string]: string} | null>}
 */
async function fetchLabel(couchDbConnector, languages, iri) {
  const response = await couchDbConnector.fetch(
    COUCHDB_DATABASE_NAME, iri);
  return parseLabelResponse(languages, response, FOAF.name);
}

/**
 * @param {import('../connector/couchdb.mjs').CouchDbConnector} couchDbConnector
 * @param {('cs' | 'en')[]} languages
 * @returns {Promise<import('./couchdb-static.mjs').CacheItem[]>}
 */
async function fetchInitialCache(couchDbConnector, languages) {
  const response = await couchDbConnector.fetch(
    COUCHDB_DATABASE_NAME, "initial_data_cache");
  return parseInitialDataCacheResponse(response, languages);
}

/**
 * @param {any} response
 * @param {('cs' | 'en')[]} languages
 * @returns {import('./couchdb-static.mjs').CacheItem[]}
 */
function parseInitialDataCacheResponse(response, languages) {
  const result = [];
  for (const item of response?.jsonld ?? []) {
    const iri = item["@id"];
    if (iri === undefined) {
      continue;
    }
    const labels = (item[FOAF.name] ?? item[SKOS.prefLabel]  ?? [])
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
