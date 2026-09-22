import { createLanguageSelector } from "../../service/language-selector.ts";
import { Language } from "../../localization/index.ts";
import {
  containsDynamicData, containsHighValueDataset,
  containsNonPublicData, containsOpenData,
} from "../../dcat-ap-cz/index.ts";


const LEGISLATION_HVD = "http://data.europa.eu/eli/reg_impl/2023/138/oj";

/**
 * @param {import('../../service/service.mjs').Services} services
 * @param {('cs' | 'en')[]} languages
 * @param {any} query
 * @returns {Promise<any>}
 */
export async function prepareData(services, languages: Language[], query) {
  const applicableLegislation = [];
  if (query.hvdDataset === true) {
    // This is for a backward compatibility.
    applicableLegislation.push(LEGISLATION_HVD);
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
    "isvs": query.isvs,
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
    "isvs": facets["isvs"].length,
  };

  await updateDatasetsInPlace(services, languages, data["documents"]);

  const lang = createLanguageSelector(languages);

  // We create dataset series facet. As we use it as a filter,
  // it is not part of Solr response.
  facets.isPartOf = [];
  for (const iri of query.isPartOf) {
    const dataset = await services.couchDbDataset.fetchDatasetPreview(iri);
    facets.isPartOf.push({
      "iri": iri,
      "count": data["found"]["documents"],
      "active": true,
      "label": lang(dataset.title) ?? iri,
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
  await services.facet.updateFacetInPlace(
    languages, facets["isvs"], query["isvs"],
    query["isvsLimit"]);
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
    document["isHvd"] =  containsHighValueDataset(legislation);
    document["isDynamicData"] =  containsDynamicData(legislation);
    // Tags based on dataset_type.
    const datasetType = document["dataset_type"];
    delete document["dataset_type"];
    document["isOpenData"] = containsOpenData(datasetType);
    document["isNonPublicData"] = containsNonPublicData(datasetType);
    //
    await services.label.addLabelToResources(languages, document["format"]);
  }
}
