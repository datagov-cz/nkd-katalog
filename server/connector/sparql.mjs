import { performance } from "perf_hooks";
import jsonld from "jsonld";

import logger from "../logger";

export function createSparqlConnector(sparqlUrl, http) {
  return {
    "executeSparqlConstruct": (query) =>
      executeSparqlConstruct(sparqlUrl, http, query),
  };
}

/**
 * @param {string} sparqlUrl
 * @param {*} http
 * @param {string} query
 * @returns {object | array}
 * @throws If there is any error loading the data.
 */
async function executeSparqlConstruct(sparqlUrl, http, query) {
  // We put format to URL and to headers as well. We need the first
  // to work with Virtuoso.
  const format = "application/ld+json";
  const url = sparqlUrl +  "?format=" + encodeURIComponent(format) + "&query=" + encodeURIComponent(query);
  const startTime = performance.now();
  const response = await http.fetch(url, {
    "headers": {
      "accept": format
    }
  });
  const endTime = performance.now();
  const durationMs = endTime - startTime;
  if (durationMs > 100) {
    logger.warn("SPARQL query execution took %i ms.", durationMs);
  }
  const content = await response.json();
  return await jsonld.flatten(content);
}
