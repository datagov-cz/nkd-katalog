import { parseFacet } from "./shared/solr-response";

const SOLR_CORE_NAME = "dataset";

export function createSolrPublisher(solrConnector) {
  return {
    "fetchPublishers": () =>
      fetchPublishers(solrConnector),
  };
}

async function fetchPublishers(solrConnector) {
  const solrQuery = buildPublishersQuery();
  const response = await solrConnector.query(SOLR_CORE_NAME, solrQuery);
  return parsePublishersResponse(response);
}

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

function parsePublishersResponse(response) {
  const facet_fields = response["facet_counts"]["facet_fields"];
  return parseFacet(facet_fields["publisher"]);
}

