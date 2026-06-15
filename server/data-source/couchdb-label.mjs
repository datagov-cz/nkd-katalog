import { parseLabelResponse } from "./shared/couchdb-response.mjs";
import { SKOS, DCTERMS } from "./shared/vocabulary.ts";

/**
 * @typedef {{
 *   fetchLabel: (languages: ('cs' | 'en')[], iri: string) => Promise<{[language: string]: string} | null>
 * }} CouchDbLabelService
 */

/**
 * @param {import('../connector/couchdb.mjs').CouchDbConnector} couchDbConnector
 * @returns {CouchDbLabelService}
 */
export function createCouchDbLabel(couchDbConnector) {
  return {
    "fetchLabel": (languages, iri) =>
      fetchLabel(couchDbConnector, languages, iri),
  };
}

const COUCHDB_DATABASE_NAME = "label";

/**
 * @param {import('../connector/couchdb.mjs').CouchDbConnector} couchDbConnector
 * @param {('cs' | 'en')[]} languages
 * @param {string} iri
 * @returns {Promise<{[language: string]: string} | null>}
 */
async function fetchLabel(couchDbConnector, languages, iri) {
  const response = await couchDbConnector.fetch(COUCHDB_DATABASE_NAME, iri);
  return parseLabelResponse(languages, response, [SKOS.prefLabel, DCTERMS.title]);
}
