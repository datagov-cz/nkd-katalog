import { performance } from "perf_hooks";
import jsonld from "jsonld";

import logger from "../logger.ts";

/**
 * @typedef {{ executeSparqlConstruct: (query: string) => Promise<object[]> }} SparqlConnector
 */

/**
 * @param {string} sparqlUrl
 * @param {any} http Raw HTTP client — needs to support passing request headers.
 * @returns {SparqlConnector}
 */
export function createSparqlConnector(sparqlUrl, http) {
  return {
    "executeSparqlConstruct": (query) =>
      executeSparqlConstruct(sparqlUrl, http, query),
  };
}

/**
 * @param {string} sparqlUrl
 * @param {any} http
 * @param {string} query
 * @returns {Promise<object[]>}
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
    logger.warn(`SPARQL query execution took ${durationMs} ms.`);
  }
  const content = await response.json();
  return await jsonld.flatten(content);
}
