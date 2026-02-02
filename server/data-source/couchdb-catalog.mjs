import { hasType, getResource, getString, getValue } from "./shared/jsonld.mjs";
import { selectForLanguages } from "./shared/couchdb-response.mjs";
import { DCTERMS, FOAF, NKOD, DCAT } from "./shared/vocabulary.ts";
import logger from "../logger";

export function createCouchDbCatalog(couchDbConnector) {
  return {
    "fetchCatalogs": (languages) =>
      fetchCatalogs(couchDbConnector, languages),
  };
}

const COUCHDB_DATABASE_NAME = "static";

async function fetchCatalogs(couchDbConnector, languages) {
  const response = await couchDbConnector.fetch(
    COUCHDB_DATABASE_NAME, "local_catalogs");
  if (response["error"] !== undefined) {
    // We assume it is missing.
    logger.error(
      "Can't fetch local catalogs for error '%s'.",
      JSON.stringify(response),
    );
    return null;
  }
  const jsonld = response["jsonld"] ?? [];
  return jsonldToCatalogs(languages, jsonld);
}

function jsonldToCatalogs(languages, jsonld) {
  const result = [];
  for (const entity of jsonld) {
    let isCatalog = false;
    const catalog = jsonldToCatalog(languages, entity);
    if (hasType(entity, NKOD.CkanApiLkod)) {
      catalog["isCkanApi"] = true;
      isCatalog = true;
    }
    if (hasType(entity, NKOD.DcatApLkod)) {
      catalog["isDcatApLkod"] = true;
      isCatalog = true;
    }
    if (hasType(entity, NKOD.DcatApSparql)) {
      catalog["isDcatApSparql"] = true;
      isCatalog = true;
    }
    if (isCatalog) {
      result.push(catalog);
    }
  }
  // Force ordering.
  result.sort((left, right) => {
    return left.iri.localeCompare(right.iri, "en");
  });
  return result;
}

function jsonldToCatalog(languages, entity) {
  const contactPoint = entity[DCAT.contactPoint] ?? {};
  return {
    "iri": entity["@id"],
    "publisher": { //
      "iri": getResource(entity, DCTERMS.publisher),
    },
    "title": selectForLanguages(languages, getString(entity, DCTERMS.title)),
    "contactPoint": {
      "email": getValue(contactPoint, FOAF.email),
      "name": selectForLanguages(languages, getString(contactPoint, FOAF.name)),
    },
    "endpointURL": getResource(entity, DCAT.endpointURL),
    "homepage": getResource(entity, FOAF.homepage),
  };
}
