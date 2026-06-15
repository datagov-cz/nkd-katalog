import { parseFacet } from "./shared/solr-response.ts";

/**
 * @typedef {{
 *   fetchPublishers: () => Promise<import('./shared/solr-response.ts').FacetItem[]>
 * }} SolrPublisherService
 */

const SOLR_CORE_NAME = "dataset";

/**
 * @param {import('../connector/solr-connector.ts').SolrConnector} solrConnector
 * @returns {SolrPublisherService}
 */
export function createSolrPublisher(solrConnector) {
  return {
    "fetchPublishers": () =>
      fetchPublishers(solrConnector),
  };
}

/**
 * @param {import('../connector/solr-connector.ts').SolrConnector} solrConnector
 * @returns {Promise<import('./shared/solr-response.ts').FacetItem[]>}
 */
async function fetchPublishers(solrConnector) {
  const solrQuery = buildPublishersQuery();
  const response = await solrConnector.query(SOLR_CORE_NAME, solrQuery);
  return parsePublishersResponse(response);
}

/**
 * @returns {import('../connector/solr-connector.ts').SolrQuery}
 */
function buildPublishersQuery() {
  return {
    // We consider publisher value to be a facet to get all publishers.
    "facet.field": [
      "publisher",
    ],
    "fl": [],
    "fq": [],
    "sort": "",
    "facet": true,
    "facet.limit": -1,
    "facet.mincount": 1,
    "start": 0,
    "rows": 0,
    "q": "*:*",
  };
}

/**
 * @param {any} response
 * @returns {import('./shared/solr-response.ts').FacetItem[]}
 */
function parsePublishersResponse(response) {
  const facet_fields = response["facet_counts"]["facet_fields"];
  return parseFacet(facet_fields["publisher"]);
}
