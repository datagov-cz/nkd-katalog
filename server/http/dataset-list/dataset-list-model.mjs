
const LEGISLATION_HVD = "http://data.europa.eu/eli/reg_impl/2023/138/oj";

const LEGISLATION_DYNAMIC_DATA = "https://www.e-sbirka.cz/eli/cz/sb/1999/106/2024-01-01/dokument/norma/cast_1/par_3a/odst_6";

const DATASET_TYPE_OPEN_DATA = "https://data.dia.gov.cz/zdroj/číselníky/typ-datové-sady/položky/otevřená-data";

const DATASET_TYPE_NON_PUBLIC_DATA = "https://data.dia.gov.cz/zdroj/číselníky/typ-datové-sady/položky/neveřejná-data";

/**
 * @param {import('../../service/service.mjs').Services} services
 * @param {string[]} languages
 * @param {any} query
 * @returns {Promise<any>}
 */
export async function prepareData(services, languages, query) {
  const applicableLegislation = [];
  if (query.hvdDataset === true) {
    applicableLegislation.push(LEGISLATION_HVD);
  }
  if (query.dynamicData === true) {
    applicableLegislation.push(LEGISLATION_DYNAMIC_DATA);
  }
  const data = await services.solrDataset.fetchDatasets(languages, {
    "searchQuery": query.searchQuery,
    "publisher": query.publisher,
    "theme": query.theme,
    "keyword": query.keyword,
    "format": query.format,
    "dataServiceType": query.dataServiceType,
    "temporalStart": query.temporalStart,
    "temporalEnd": query.temporalEnd,
    "vdfPublicData": query.vdfPublicData,
    "vdfCodelist": query.vdfCodelist,
    "isPartOf": query.isPartOf,
    "sort": query.sort,
    "sortDirection": query.sortDirection,
    "offset": query.page * query.pageSize,
    "limit": query.pageSize,
    "hvdCategory": query.hvdCategory,
    "applicableLegislation": applicableLegislation,
    "datasetType": query.datasetType,
  });

  const facets = data["facets"];

  data["found"] = {
    "documents": data["found"],
    "keyword": facets["keyword"].length,
    "format": facets["format"].length,
    "dataServiceType": facets["dataServiceType"].length,
    "publisher": facets["publisher"].length,
    "theme": facets["theme"].length,
    "hvdCategory": facets["hvdCategory"].length,
    "datasetType": facets["datasetType"].length,
  };

  await updateDatasetsInPlace(services, languages, data["documents"]);

  // We create dataset series facet. As we use it as a filter,
  // it is not part of Solr response.
  facets.isPartOf = [];
  for (const iri of query.isPartOf) {
    facets.isPartOf.push({
      "iri": iri,
      "count": data["found"]["documents"],
      "active": true,
      "label": (await services.couchDbDataset.fetchDatasetPreview(languages, iri))?.title ?? iri,
    });
  }

  // Other facets.
  await services.facet.updateFacetInPlace(
    languages, facets["keyword"], query["keyword"], query["keywordLimit"],
    (item) => item.label = item.iri);
  await services.facet.updateFacetInPlace(
    languages, facets["format"], query["format"], query["formatLimit"]);
  await services.facet.updateFacetInPlace(
    languages, facets["dataServiceType"], query["dataServiceType"], query["dataServiceTypeLimit"]);
  await services.facet.updateFacetInPlace(
    languages, facets["publisher"], query["publisher"], query["publisherLimit"]);
  await services.facet.updateFacetInPlace(
    languages, facets["theme"], query["theme"], query["themeLimit"]);
  await services.facet.updateFacetInPlace(
    languages, facets["hvdCategory"], query["hvdCategory"], query["hvdCategoryLimit"]);
  await services.facet.updateFacetInPlace(
    languages, facets["datasetType"], query["datasetType"],
    query["datasetTypeLimit"]);
  return data;
};

async function updateDatasetsInPlace(services, languages, documents) {
  for (const document of documents) {
    // Tags based on distribution formats.
    document["format"] = document["file_type"].map(iri => ({ "iri": iri }));
    delete document["file_type"];
    // Tags based on legislation.
    const legislation = document["applicable_legislation"];
    delete document["applicable_legislation"];
    document["isHvd"] =  legislation.includes(LEGISLATION_HVD);
    document["isDynamicData"] =  legislation.includes(LEGISLATION_DYNAMIC_DATA);
    // Tags based on dataset_type.
    const datasetType = document["dataset_type"];
    delete document["dataset_type"];
    document["isOpenData"] = datasetType.includes(DATASET_TYPE_OPEN_DATA);
    document["isNonPublicData"] = datasetType.includes(DATASET_TYPE_NON_PUBLIC_DATA);
    //
    await services.label.addLabelToResources(languages, document["format"]);
  }
}
