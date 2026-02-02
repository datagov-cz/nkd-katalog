import { parseLabelResponse } from "./shared/couchdb-response.mjs";
import { SKOS, DCTERMS } from "./shared/vocabulary.ts";

export function createCouchDbLabel(couchDbConnector) {
  return {
    /**
     * Returns tuple {language: value}.
     */
    "fetchLabel": (languages, iri) =>
      fetchLabel(couchDbConnector, languages, iri),
  };
}

const COUCHDB_DATABASE_NAME = "label";

async function fetchLabel(couchDbConnector, languages, iri) {
  const response = await couchDbConnector.fetch(COUCHDB_DATABASE_NAME, iri);
  return parseLabelResponse(languages, response, [SKOS.prefLabel, DCTERMS.title]);
}
