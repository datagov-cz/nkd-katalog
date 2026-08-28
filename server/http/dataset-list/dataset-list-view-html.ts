import { FastifyReply } from "fastify";

import { ROUTE } from "../route-name.mjs";
import * as components from "../../component/index.mjs";
import {headerHtml} from "../../component/header.ts";
import {footerHtml} from "../../component/footer.ts";
import type { Configuration } from "../../configuration.ts";
import type { TranslationService } from "../../service/translation-service.ts";
import type { NavigationEntry } from "../../service/navigation-service.ts";
import type { Language } from "../../localization/index.ts";
import type { QuerySectionState } from "../../component/query-section/index.ts";
import type {
  DatasetListData,
  DatasetListQuery,
  DatasetListState,
  DatasetListViewServices,
} from "./dataset-list-state.ts";

const FACET_SERIES = {
  "name": "datasetSeries",
  "tooltip": "datasetSeriesTooltip"
};

const FACETS = [
  { "name": "publisher", "tooltip": "publisherTooltip" },
  { "name": "datasetType", "tooltip": "datasetTypeTooltip" },
  { "name": "theme", "tooltip": "themeTooltip" },
  { "name": "hvdCategory", "tooltip": "hvdCategoryTooltip" },
  { "name": "dataServiceType", "tooltip": "dataServiceTypeTooltip" },
  { "name": "format", "tooltip": "formatTooltip" },
  { "name": "keyword", "tooltip": "keywordTooltip" },
  { "name": "isvs", "tooltip": "isvsTooltip" }
];

const SORT_OPTIONS = [
  ["title", "asc"],
  ["title", "desc"],
];

export function renderHtml(
  services: DatasetListViewServices,
  languages: Language[],
  query: DatasetListQuery,
  data: DatasetListData,
  reply: FastifyReply,
): void {
  const templateData = prepareTemplateData(
    services.configuration, services.translation, services.navigation, languages, query, data);
  const template = services.template.view(ROUTE.DATASET_LIST);
  reply
    .code(200)
    .header("Content-Type", "text/html; charset=utf-8")
    .send(template(templateData));
}

export function prepareTemplateData(
  configuration: Configuration,
  translation: TranslationService,
  navigation: NavigationEntry,
  languages: Language[],
  query: DatasetListQuery,
  data: DatasetListData,
): DatasetListState {
  const documents = data["documents"];
  prepareDocumentsInPlace(navigation, documents);
  const count = data["found"]["documents"];
  const facets = prepareFacets(translation, navigation, query, data["facets"], data["found"]);

  //
  //
  //

  const querySection: QuerySectionState = {
    temporalStart: null,
    temporalEnd: null,
    publishers: [],
    dataServiceTypes: [],
    themes: [],
    hvdCategories: [],
    datasetTypes: [],
    formats: [],
    keywords: [],
    isvs: []
  };

  {

    if (query.temporalStart) {
      querySection.temporalStart = {
        label: query.temporalStart,
        href: navigation.linkFromServer({ ...query, temporalStart: undefined }),
      }
    }

    if (query.temporalEnd) {
      querySection.temporalEnd = {
        label: query.temporalEnd,
        href: navigation.linkFromServer({ ...query, temporalEnd: undefined }),
      }
    }

    // We know the facets ordering is the same as in the array.
    const [
      publishers, datasetTypes, themes, hvdCategories, dataServiceTypes,
      formats, keywords, isvs,
    ] = facets;

    querySection.publishers = publishers.items
      .filter(item => item.active)
      .map(item => ({ label: item.label, href: item.href }));

    querySection.datasetTypes = datasetTypes.items
      .filter(item => item.active)
      .map(item => ({ label: item.label, href: item.href }));

    querySection.themes = themes.items
      .filter(item => item.active)
      .map(item => ({ label: item.label, href: item.href }));

    querySection.hvdCategories = hvdCategories.items
      .filter(item => item.active)
      .map(item => ({ label: item.label, href: item.href }));

    querySection.dataServiceTypes = dataServiceTypes.items
      .filter(item => item.active)
      .map(item => ({ label: item.label, href: item.href }));

    querySection.formats = formats.items
      .filter(item => item.active)
      .map(item => ({ label: item.label, href: item.href }));

    querySection.keywords = keywords.items
      .filter(item => item.active)
      .map(item => ({ label: item.label, href: item.href }));

    querySection.isvs = isvs.items
      .filter(item => item.active)
      .map(item => ({ label: item.label, href: item.href }));

  }

  //
  //
  //

  return {
    "head": components.createHeadData(configuration),
    "headerHtml": headerHtml(navigation, languages[0], query),
    "footerHtml": footerHtml(languages[0]),
    "search": {
      "clear-href": navigation.linkFromServer({}),
      // Empty query used by client-side JavaScript search functionality.
      // We need to remove values for all in the search box as that is assembled
      // at the client side.
      "base-url": navigation.linkFromServer({
        ...query,
        "searchQuery": null,
        "page": 0,
        "temporalStart": null,
        "temporalEnd": null,
        "vdfPublicData": false,
        "vdfCodelist": false,
        "hvdDataset": false,
      }),
      "query": {
        "searchQuery": query.searchQuery,
        "temporalFrom": query.temporalStart,
        "temporalTo": query.temporalEnd,
        "publicData": query.vdfPublicData,
        "codelist": query.vdfCodelist,
        "hvdDataset": query.hvdDataset,
        "datasetType": query.datasetType,
        "isvs": query.isvs,
      },
      "queryObjectAsString": JSON.stringify({
        "searchQuery": query.searchQuery,
        "temporalFrom": query.temporalStart,
        "temporalTo": query.temporalEnd,
        "publicData": query.vdfPublicData,
        "codelist": query.vdfCodelist,
        "hvdDataset": query.hvdDataset,
        "datasetType": query.datasetType,
        "isvs": query.isvs,
      })
    },
    "query-section": components.prepareStateForHandlebars(querySection, languages[0]),
    "result-bar": components.createResultBarData(translation, navigation, query, SORT_OPTIONS, count),
    "pagination": components.createPaginationData(navigation, query, count),
    "documents": documents,
    "facets": facets,
  };
}

function prepareDocumentsInPlace(navigation, suggestions) {
  const suggestionDetailNavigation = navigation.changeView(ROUTE.DATASET_DETAIL);
  for (const suggestion of suggestions) {
    suggestion["href"] = suggestionDetailNavigation.linkFromServer({
      "iri": suggestion["iri"]
    });
  }
}

function prepareFacets(translation, navigation, query, facets, counts) {
  const result = [];
  if (query.isPartOf.length > 0) {
    const name = "isPartOf";
    const facetData = facets[name];
    const facetLabel = translation.translate(FACET_SERIES.name);
    const facetTooltip = translation.translate(FACET_SERIES.tooltip);
    //
    result.push(components.createFacetData(
      navigation, query, facetData, name, facetLabel, facetTooltip,
      query.isPartOf.length));
  }
  for (const { name, tooltip } of FACETS) {
    const facetData = facets[name];
    const facetLabel = translation.translate(name);
    const facetTooltip = tooltip === undefined ? undefined :
      translation.translate(tooltip);
    result.push(components.createFacetData(
      navigation, query, facetData, name, facetLabel, facetTooltip,
      counts[name]));
  }
  return result;
}
