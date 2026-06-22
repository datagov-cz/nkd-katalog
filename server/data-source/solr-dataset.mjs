/**
 * @typedef {{
 * searchQuery: string | null,
 * publisher: string[],
 * theme: string[],
 * keyword: string[],
 * format: string[],
 * dataServiceType: string[],
 * temporalStart: string | null,
 * temporalEnd: string | null,
 * vdfPublicData: boolean | null,
 * vdfCodelist: boolean | null,
 * isPartOf: string[],
 * dataset_type?: string[],
 * hvdCategory: string[],
 * applicableLegislation: string[],
 * datasetType: string[],
 * sort: string,
 * sortDirection: "asc" | "desc",
 * offset: number,
 * limit: number,
 * }} SolrDatasetQuery
 *
 * @typedef {{
 * iri: string,
 * title: string,
 * description: string,
 * file_type: string[],
 * applicable_legislation: string[],
 * dataset_type: [],
 * }} SolrDataset
 *
 * @typedef {{
 * found: number,
 * documents: SolrDataset[],
 * facets: Record<string, number>
 * }} SolrDatasetResponse
 *
 * @typedef {import('./shared/solr-response.ts').FacetItem[]} Facet
 *
 * @typedef {{
 * found: any,
 * documents: SolrDataset[],
 * facets: {
 *   keyword: Facet,
 *   format: Facet,
 *   dataServiceType: Facet,
 *   publisher: Facet,
 *   theme: Facet,
 *   hvdCategory: Facet,
 *   datasetType: Facet,
 *   isPartOf?: any[],
 * }}} DatasetsResponse
 *
 * @typedef {{
 * isPartOf: string[],
 * sort: string,
 * sortDirection: "asc" | "desc",
 * }} SolrPartOfDatasetQuery
 *
 * @typedef {{
 * iri: string,
 * title: string,
 * description: string,
 * file_type: string[],
 * }} SolrPartOfDataset
 *
 * @typedef {{
 * found: number,
 * documents: SolrPartOfDataset[],
 * }} SolrPartOfDatasetResponse
 *
 * @typedef {{
 * fetchStatistics: (language:string) => any,
 * fetchDatasets: (languages: string[], query: SolrDatasetQuery) => Promise<DatasetsResponse>,
 * fetchDatasetsForDatasetsDetail: (languages: string[], query: SolrPartOfDatasetQuery) => Promise<SolrPartOfDatasetResponse>,
 * }} SolrDatasetService
 */

import { prepareFieldQuery, prepareTextQuery, prepareSort } from "./shared/solr-query.ts";
import { selectLanguage, parseFacet } from "./shared/solr-response.ts";

const SOLR_CORE_NAME = "dataset";

/**
 * @returns {SolrDatasetService}
 */
export function createSolrDataset(solrConnector) {
  return {
    /**
     * @param {string} language
     */
    "fetchStatistics": (language) =>
      fetchStatistics(solrConnector, language),
    /**
     * @param {('cs' | 'en')[]} languages
     * @param {SolrDatasetQuery} query
     * @returns {Promise<DatasetsResponse>}
     */
    "fetchDatasets": (languages, query) =>
      fetchDatasets(solrConnector, languages, query),
    /**
     * @param {('cs' | 'en')[]} languages
     * @param {SolrPartOfDatasetQuery} query
     * @returns {Promise<SolrPartOfDatasetResponse>}
     */
    "fetchDatasetsForDatasetsDetail": (languages, query) =>
      fetchDatasetsForDatasetsDetail(solrConnector, languages, query),
  };
}

async function fetchStatistics(solrConnector, language) {
  const solrQuery = {
    "facet": true,
    "facet.field": [
      `keyword_${language}`,
      "publisher",
    ],
    "facet.limit": -1,
    "start": 0,
    "rows": 0,
    "q": "*:*",
  };
  const response = await solrConnector.query(SOLR_CORE_NAME, solrQuery);
  const facetFields = response["facet_counts"]["facet_fields"];
  return {
    "datasetsCount": response["response"]["numFound"],
    "keywordsCount": facetFields[`keyword_${language}`].length / 2,
    "publishersCount": facetFields["publisher"].length / 2,
  };
}

/**
 * @param {*} solrConnector
 * @param {('cs' | 'en')[]} languages
 * @param {SolrDatasetQuery} query
 * @returns {Promise<DatasetsResponse>}
 */
async function fetchDatasets(solrConnector, languages, query) {
  const solrQuery = buildDatasetsQuery(languages[0], query);
  const response = await solrConnector.query(SOLR_CORE_NAME, solrQuery);
  return parseDatasetsResponse(languages, response);
}

/**
 * @param {string} language
 * @param {SolrDatasetQuery} query
 * @returns
 */
function buildDatasetsQuery(language, query) {
  const {
    searchQuery,
    publisher,
    theme,
    keyword,
    format,
    dataServiceType,
    temporalStart,
    temporalEnd,
    vdfPublicData,
    vdfCodelist,
    isPartOf,
    sort,
    sortDirection,
    offset,
    limit,
    hvdCategory,
    applicableLegislation,
    datasetType,
    isvs,
  } = query;
  const fq = [
    ...prepareFieldQuery("publisher", publisher),
    ...prepareFieldQuery("theme", theme),
    ...prepareFieldQuery(`keyword_${language}`, keyword),
    ...prepareFieldQuery("file_type", format),
    ...prepareFieldQuery("data_service_type", dataServiceType),
    ...prepareFieldQuery("is_part_of", isPartOf),
    ...prepareFieldQuery("hvd_category", hvdCategory),
    ...prepareFieldQuery("applicable_legislation", applicableLegislation),
    ...prepareFieldQuery("dataset_type", datasetType),
    ...prepareFieldQuery("isvs", isvs),
  ];
  if (temporalStart !== null) {
    fq.push(`temporal_start:[* TO ${temporalStart}T00:00:00Z]`);
  }
  if (temporalEnd !== null) {
    fq.push(`temporal_end:[${temporalEnd}T00:00:00Z TO *]`);
  }
  if (vdfCodelist === true) {
    fq.push("vdf_public_data:\"true\"");
  }
  if (vdfPublicData === true) {
    fq.push("vdf_codelist:\"true\"");
  }
  const result = {
    "facet.field": [
      `keyword_${language}`,
      "file_type",
      "data_service_type",
      "publisher",
      "theme",
      "hvd_category",
      "dataset_type",
      "isvs",
    ],
    "fl": [
      "iri",
      "title_cs",
      "title_en",
      "description_cs",
      "description_en",
      "file_type",
      "applicable_legislation",
      "dataset_type",
    ],
    "fq": fq,
    "sort": prepareSort(language, sort, sortDirection),
    "facet": true,
    "facet.limit": -1,
    "facet.mincount": 1,
    "start": offset,
    "q": prepareTextQuery(language, searchQuery),
  };
  if (limit > 0) {
    result.rows = limit;
  }
  return result;
}

/**
 * @param {('cs' | 'en')[]} languages
 * @param {*} response
 * @returns {DatasetsResponse}
 */
function parseDatasetsResponse(languages, response) {
  const documents = response["response"]["docs"].map(document =>
    parseDatasetResponseDocument(document, languages));

  const language = languages[0];
  const facet_fields = response["facet_counts"]["facet_fields"];
  const facets = {
    "keyword": parseFacet(facet_fields[`keyword_${language}`]),
    "format": parseFacet(facet_fields["file_type"]),
    "dataServiceType": parseFacet(facet_fields["data_service_type"]),
    "publisher": parseFacet(facet_fields["publisher"]),
    "theme": parseFacet(facet_fields["theme"]),
    "hvdCategory": parseFacet(facet_fields["hvd_category"]),
    "datasetType": parseFacet(facet_fields["dataset_type"]),
    "isvs": parseFacet(facet_fields["isvs"]),
  };

  return {
    "found": response["response"]["numFound"],
    "documents": documents,
    "facets": facets,
  };
}

/**
 * @param {*} document
 * @param {('cs' | 'en')[]} languages
 * @returns {SolrDataset}
 */
function parseDatasetResponseDocument(document, languages) {
  return {
    "iri": document["iri"],
    "title": selectLanguage(document, "title_", languages),
    "description": selectLanguage(document, "description_", languages),
    "file_type": document["file_type"] ?? [],
    "applicable_legislation": document["applicable_legislation"] ?? [],
    "dataset_type": document["dataset_type"] ?? [],
    "isvs": document["isvs"] ?? [],
  }
}

/**
 * @param {*} solrConnector
 * @param {('cs' | 'en')[]} languages
 * @param {SolrPartOfDatasetQuery} query
 * @returns {Promise<{found: number, documents: SolrPartOfDataset[]}>}
 */
async function fetchDatasetsForDatasetsDetail(solrConnector, languages, query) {
  const solrQuery = buildDatasetsDetailQuery(languages[0], query);
  const response = await solrConnector.query(SOLR_CORE_NAME, solrQuery);
  return parseDatasetsDetailResponse(languages, response);
}

/**
 * @param {string} language
 * @param {SolrPartOfDatasetQuery} query
 * @returns
 */
function buildDatasetsDetailQuery(language, query) {
  const {
    isPartOf,
    sort,
    sortDirection,
  } = query;
  const fq = [
    ...prepareFieldQuery("is_part_of", isPartOf),
  ];
  const result = {
    "fl": [
      "iri",
      "title_cs",
      "title_en",
      "description_cs",
      "description_en",
      "file_type",
      "isvs",
    ],
    "fq": fq,
    "sort": prepareSort(language, sort, sortDirection),
    "start": 0,
    "q": "*:*",
  };
  return result;
}

/**
 * @returns {{found: number, documents: SolrPartOfDataset[]}}
 */
function parseDatasetsDetailResponse(languages, response) {
  const documents = response["response"]["docs"].map(document => ({
    "iri": document["iri"],
    "title": selectLanguage(document, "title_", languages),
    "description": selectLanguage(document, "description_", languages),
    "file_type": document["file_type"] ?? [],
    "isvs": document["isvs"] ?? [],
  }));

  return {
    "found": response["response"]["numFound"],
    "documents": documents,
  };
}
