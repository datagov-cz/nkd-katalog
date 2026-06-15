import { prepareFieldQuery, prepareTextQuery, prepareSort } from "./shared/solr-query.ts";
import { emptyAsNull, parseFacet, parseDate } from "./shared/solr-response.ts";

/**
 * @typedef {{
 *   iri: string,
 *   title: string | null,
 *   description: string | null,
 *   created: Date | null,
 *   themes: any[],
 *   state: any,
 *   datasets: any[],
 *   publisher: { iri: string | null, title: string | null },
 *   mandatory_106: unknown,
 *   obstacle_special_regulation: unknown,
 *   obstacle_106: unknown,
 *   publication_plan: string | null,
 * }} SolrSuggestion
 *
 * @typedef {{
 *   searchQuery: string | null,
 *   theme: string[],
 *   publisher: string[],
 *   state: string[],
 *   sort: string,
 *   sortDirection: "asc" | "desc",
 *   offset: number,
 *   limit: number,
 * }} SolrSuggestionQuery
 *
 * @typedef {{
 *   iri: string,
 *   title: string | null,
 *   description: string | null,
 *   themes: string[],
 * }} SolrSuggestionListItem
 *
 * @typedef {{
 *   found: any,
 *   documents: SolrSuggestionListItem[],
 *   facets: {
 *     theme: import('./shared/solr-response.ts').FacetItem[],
 *     publisher: import('./shared/solr-response.ts').FacetItem[],
 *     state: import('./shared/solr-response.ts').FacetItem[],
 *   },
 * }} SolrSuggestionsResponse
 *
 * @typedef {{
 *   fetchSuggestion: (iri: string) => Promise<SolrSuggestion | null>,
 *   fetchSuggestions: (query: SolrSuggestionQuery) => Promise<SolrSuggestionsResponse>,
 * }} SolrSuggestionService
 */

const SOLR_CORE_NAME = "suggestion";

/**
 * @param {import('../connector/solr-connector.ts').SolrConnector} solrConnector
 * @returns {SolrSuggestionService}
 */
export function createSolrSuggestion(solrConnector) {
  return {
    "fetchSuggestion": (query) =>
      fetchSuggestion(solrConnector, query),
    "fetchSuggestions": (query) =>
      fetchSuggestions(solrConnector, query),
  };
}

async function fetchSuggestion(solrConnector, iri) {
  const solrQuery = buildSuggestionQuery(iri);
  const response = await solrConnector.query(SOLR_CORE_NAME, solrQuery);
  return parseSuggestionResponse(response);
}

function buildSuggestionQuery(iri) {
  return {
    "fl": [
      "iri",
      "title_cs",
      "description_cs",
      "theme",
      "created",
      "publisher",
      "publisher_cs",
      "state",
      "dataset",
      "mandatory_106",
      "obstacle_special_regulation",
      "obstacle_106",
      "publication_plan",
    ],
    "fq": [
      ...prepareFieldQuery("iri", [iri]),
    ],
    "q": "*:*",
  };
}

function parseSuggestionResponse(response) {
  const documentCount = response["response"]["numFound"];
  if (documentCount == 0) {
    return null;
  }
  const document = response["response"]["docs"][0];
  return {
    "iri": document["iri"],
    "title": document["title_cs"],
    "description": document["description_cs"],
    "created": parseDate(document["created"]),
    "themes": document["theme"] ?? [],
    "state": document["state"] ?? [],
    "datasets": document["dataset"] ?? [],
    "publisher": {
      "iri": emptyAsNull(document["publisher"]),
      "title": emptyAsNull(document["publisher_cs"]),
    },
    "mandatory_106": document["mandatory_106"],
    "obstacle_special_regulation": document["obstacle_special_regulation"],
    "obstacle_106": document["obstacle_106"],
    "publication_plan": document["publication_plan"] ?? null,
  };
}

async function fetchSuggestions(solrConnector, query) {
  // We have only one language.
  const solrQuery = buildSuggestionsQuery(query);
  const response = await solrConnector.query(SOLR_CORE_NAME, solrQuery);
  return parseSuggestionsResponse(response);
}

function buildSuggestionsQuery(query) {
  const {
    searchQuery,
    theme,
    publisher,
    state,
    sort,
    sortDirection,
    offset,
    limit
  } = query;
  return {
    "facet.field": [
      "theme",
      "publisher",
      "state",
    ],
    "fl": [
      "iri",
      "title_cs",
      "description_cs",
      "theme",
    ],
    "fq": [
      ...prepareFieldQuery("theme", theme),
      ...prepareFieldQuery("publisher", publisher),
      ...prepareFieldQuery("state", state),
    ],
    "sort": prepareSort("cs", sort, sortDirection),
    "facet": true,
    "facet.limit": -1,
    "facet.mincount": 1,
    "start": offset,
    "rows": limit,
    "q": prepareTextQuery("cs", searchQuery),
  };
}

function parseSuggestionsResponse(response) {
  const documents = response["response"]["docs"].map(document => ({
    "iri": document["iri"],
    "title": document["title_cs"],
    "description": document["description_cs"],
    "themes": document["theme"] ?? [],
  }));

  const facet_fields = response["facet_counts"]["facet_fields"];
  const facets = {
    "theme": parseFacet(facet_fields["theme"]),
    "publisher": parseFacet(facet_fields["publisher"]),
    "state": parseFacet(facet_fields["state"]),
  };

  return {
    "found": response["response"]["numFound"],
    "documents": documents,
    "facets": facets,
  };
}

