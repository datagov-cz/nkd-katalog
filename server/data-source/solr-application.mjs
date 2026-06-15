import { prepareFieldQuery, prepareTextQuery, prepareSort } from "./shared/solr-query.ts";
import { selectLanguage, emptyAsNull, parseFacet, parseDate } from "./shared/solr-response.ts";

/**
 * @typedef {{
 *   iri: string,
 *   title: string | null,
 *   description: string | null,
 *   states: any[],
 *   platforms: any[],
 *   themes: any[],
 *   types: any[],
 *   author: { iri: string | null, title: string | null },
 *   link: string,
 *   datasets: any[],
 *   modified: Date | null,
 *   published: Date | null,
 * }} SolrApplication
 *
 * @typedef {{
 *   searchQuery: string | null,
 *   state: string[],
 *   platform: string[],
 *   theme: string[],
 *   type: string[],
 *   sort: string,
 *   sortDirection: "asc" | "desc",
 *   offset: number,
 *   limit: number,
 * }} SolrApplicationQuery
 *
 * @typedef {{
 *   iri: string,
 *   title: string | null,
 *   description: string | null,
 *   themes: string[],
 * }} SolrApplicationListItem
 *
 * @typedef {{
 *   found: any,
 *   documents: SolrApplicationListItem[],
 *   facets: {
 *     state: import('./shared/solr-response.ts').FacetItem[],
 *     platform: import('./shared/solr-response.ts').FacetItem[],
 *     theme: import('./shared/solr-response.ts').FacetItem[],
 *     type: import('./shared/solr-response.ts').FacetItem[],
 *   },
 * }} SolrApplicationsResponse
 *
 * @typedef {{
 *   fetchApplicationsCount: () => Promise<number>,
 *   fetchApplication: (languages: string[], iri: string) => Promise<SolrApplication | null>,
 *   fetchApplications: (languages: string[], query: SolrApplicationQuery) => Promise<SolrApplicationsResponse>,
 *   fetchApplicationsWithDatasets: (languages: string[], datasets: string[]) => Promise<SolrApplicationListItem[]>,
 * }} SolrApplicationService
 */

const SOLR_CORE_NAME = "application";

/**
 * @param {import('../connector/solr-connector.ts').SolrConnector} solrConnector
 * @returns {SolrApplicationService}
 */
export function createSolrApplication(solrConnector) {
  return {
    "fetchApplicationsCount": () =>
      fetchApplicationsCount(solrConnector),
    "fetchApplication": (languages, iri) =>
      fetchApplication(solrConnector, languages, iri),
    "fetchApplications": (languages, query) =>
      fetchApplications(solrConnector, languages, query),
    "fetchApplicationsWithDatasets": (languages, datasets) =>
      fetchApplicationsWithDatasets(solrConnector, languages, datasets),
  };
}

async function fetchApplicationsCount(solrConnector) {
  const solrQuery = {
    "start": 0,
    "rows": 0,
    "q": "*:*",
  };
  const response = await solrConnector.query(SOLR_CORE_NAME, solrQuery);
  return response["response"]["numFound"];
}

async function fetchApplication(solrConnector, languages, iri) {
  const solrQuery = buildApplicationQuery(iri);
  const response = await solrConnector.query(SOLR_CORE_NAME, solrQuery);
  return parseApplicationResponse(languages, response);
}

function buildApplicationQuery(iri) {
  return {
    "fl": [
      "iri",
      "title_cs",
      "title_en",
      "description_cs",
      "description_en",
      "state",
      "platform",
      "theme",
      "type",
      "author",
      "author_cs",
      "author_en",
      "link",
      "dataset",
      "modified",
      "published",
    ],
    "fq": [
      ...prepareFieldQuery("iri", [iri]),
    ],
    "q": "*:*",
  };
}

function parseApplicationResponse(languages, response) {
  const documentCount = response["response"]["numFound"];
  if (documentCount == 0) {
    return null;
  }
  const document = response["response"]["docs"][0];
  return {
    "iri": document["iri"],
    "title": selectLanguage(document, "title_", languages),
    "description": selectLanguage(document, "description_", languages),
    "states": document["state"] ?? [],
    "platforms": document["platform"] ?? [],
    "themes": document["theme"] ?? [],
    "types": [document["type"]], // This is stored as single value in Solr.
    "author": {
      "iri": emptyAsNull(document["author"]),
      "title": emptyAsNull(selectLanguage(document, "author_", languages)),
    },
    "link": document["link"],
    "datasets": document["dataset"] ?? [],
    "modified": parseDate(document["modified"]),
    "published": parseDate(document["published"]),
  };
}

async function fetchApplications(solrConnector, languages, query) {
  const primaryLanguage = languages[0];
  const solrQuery = buildApplicationsQuery(primaryLanguage, query);
  const response = await solrConnector.query(SOLR_CORE_NAME, solrQuery);
  return parseApplicationsResponse(languages, response);
}

function buildApplicationsQuery(language, query) {
  const {
    searchQuery,
    state,
    platform,
    theme,
    type,
    sort,
    sortDirection,
    offset,
    limit
  } = query;
  return {
    "facet.field": [
      "state",
      "platform",
      "theme",
      "type",
    ],
    "fl": [
      "iri",
      "title_cs",
      "title_en",
      "description_cs",
      "description_en",
      "theme",
    ],
    "fq": [
      ...prepareFieldQuery("state", state),
      ...prepareFieldQuery("platform", platform),
      ...prepareFieldQuery("theme", theme),
      ...prepareFieldQuery("type", type),
    ],
    "sort": prepareSort(language, sort, sortDirection),
    "facet": true,
    "facet.limit": -1,
    "facet.mincount": 1,
    "start": offset,
    "rows": limit,
    "q": prepareTextQuery(language, searchQuery),
  };
}

function parseApplicationsResponse(languages, response) {
  const documents = response["response"]["docs"].map(document => ({
    "iri": document["iri"],
    "title": selectLanguage(document, "title_", languages),
    "description": selectLanguage(document, "description_", languages),
    "themes": document["theme"] ?? [],
  }));

  const facet_fields = response["facet_counts"]["facet_fields"];
  const facets = {
    "state": parseFacet(facet_fields["state"]),
    "platform": parseFacet(facet_fields["platform"]),
    "theme": parseFacet(facet_fields["theme"]),
    "type": parseFacet(facet_fields["type"]),
  };

  return {
    "found": response["response"]["numFound"],
    "documents": documents,
    "facets": facets,
  };
}

async function fetchApplicationsWithDatasets(solrConnector, languages, datasets) {
  const solrQuery = buildApplicationsWithDatasetsQuery(datasets);
  const response = await solrConnector.query(SOLR_CORE_NAME, solrQuery);
  return parseApplicationsWithDatasetsResponse(languages, response);
}

function buildApplicationsWithDatasetsQuery(datasets) {
  return {
    "fl": [
      "iri",
      "title_cs",
      "title_en",
      "description_cs",
      "description_en",
    ],
    "fq": [
      prepareFieldQuery("dataset", datasets).join(" OR "),
    ],
    "q": "*:*",
  };
}

function parseApplicationsWithDatasetsResponse(languages, response) {
  const documents = response["response"]["docs"];
  return documents.map(document => ({
    "iri": document["iri"],
    "title": selectLanguage(document, "title_", languages),
    "description": selectLanguage(document, "description_", languages),
  }));
}