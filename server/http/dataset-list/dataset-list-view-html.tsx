import { FastifyReply } from "fastify";

import { ROUTE } from "../route-name.mjs";
import * as components from "../../component/index.mjs";
import { Head } from "../../component/head.tsx";
import { Facet } from "../../component/facet.tsx";
import { ResultBar } from "../../component/result-bar.tsx";
import { Pagination } from "../../component/pagination.tsx";
import { QuerySection } from "../../component/query-section/index.ts";
import { headerHtml } from "../../component/header.ts";
import { footerHtml } from "../../component/footer.ts";
import { renderToHtml } from "../../html/render-html.ts";
import { breakLines } from "../../html/escape.ts";
import type { Configuration } from "../../configuration.ts";
import type { TranslationService } from "../../service/translation-service.ts";
import type { NavigationEntry } from "../../service/navigation-service.ts";
import type { Language } from "../../localization/index.ts";
import type { QuerySectionState } from "../../component/query-section/index.ts";
import type {
  DatasetListData,
  DatasetListDocument,
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
  const state = prepareTemplateData(
    services.configuration, services.translation, services.navigation, languages, query, data);
  const html = renderDatasetListHtml(state, languages[0]);
  reply
    .code(200)
    .header("Content-Type", "text/html; charset=utf-8")
    .send(html);
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
  prepareDocumentsInPlace(translation, navigation, documents);
  const count = data["found"]["documents"];
  const facets = prepareFacets(translation, navigation, query, data["facets"], data["found"]);
  const dictionary = translation.dictionary;

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

  if (query.temporalStart) {
    querySection.temporalStart = {
      label: query.temporalStart,
      href: navigation.linkFromServer({ ...query, temporalStart: undefined }),
    };
  }
  if (query.temporalEnd) {
    querySection.temporalEnd = {
      label: query.temporalEnd,
      href: navigation.linkFromServer({ ...query, temporalEnd: undefined }),
    };
  }

  // We know the facets ordering is the same as in the array.
  const [
    publishers, datasetTypes, themes, hvdCategories, dataServiceTypes,
    formats, keywords, isvs,
  ] = facets;
  const active = (facet) => facet.items
    .filter((item) => item.active)
    .map((item) => ({ label: item.label, href: item.href }));
  querySection.publishers = active(publishers);
  querySection.datasetTypes = active(datasetTypes);
  querySection.themes = active(themes);
  querySection.hvdCategories = active(hvdCategories);
  querySection.dataServiceTypes = active(dataServiceTypes);
  querySection.formats = active(formats);
  querySection.keywords = active(keywords);
  querySection.isvs = active(isvs);

  const queryForBootstrap = {
    "searchQuery": query.searchQuery,
    "temporalFrom": query.temporalStart,
    "temporalTo": query.temporalEnd,
    "publicData": query.vdfPublicData,
    "codelist": query.vdfCodelist,
    "hvdDataset": query.hvdDataset,
    "datasetType": query.datasetType,
    "isvs": query.isvs,
  };

  return {
    "head": components.createHeadData(configuration),
    "headerHtml": headerHtml(navigation, languages[0], query),
    "footerHtml": footerHtml(languages[0]),
    "pageTitle": dictionary["page-title"],
    "pageDescription": dictionary["page-description"],
    "searchPlaceholder": dictionary["search-placeholder"],
    "searchInputLabel": dictionary["search-input-label"],
    "wcagSearch": dictionary["wcag-search"],
    "searchButton": dictionary["search-button"],
    "extendedSearch": dictionary["extended-search"],
    "temporalFrom": dictionary["temporal-from"],
    "temporalTo": dictionary["temporal-to"],
    "thisYear": dictionary["this-year"],
    "lastYear": dictionary["last-year"],
    "clearFiltersLabel": dictionary["clear-filters-label"],
    "clearFilters": dictionary["clear-filters"],
    "hvdTooltip": dictionary["hvd-tooltip"],
    "openData": dictionary["open-data"],
    "nonPublicData": dictionary["non-public-data"],
    "dynamicChip": dictionary["dynamic-chip"],
    "dynamicTooltip": dictionary["dynamic-tooltip"],
    "jsSearchQuery": dictionary["js-searchQuery"],
    "jsTemporalFrom": dictionary["js-temporalFrom"],
    "jsTemporalTo": dictionary["js-temporalTo"],
    "jsPublicData": dictionary["js-publicData"],
    "jsCodelist": dictionary["js-codelist"],
    "search": {
      "clear-href": navigation.linkFromServer({}),
      // Empty query used by client-side JavaScript search functionality.
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
      "query": queryForBootstrap,
      "queryObjectAsString": JSON.stringify(queryForBootstrap),
    },
    "query-section": components.createQuerySectionData(querySection, languages[0]),
    "result-bar": components.createResultBarData(translation, navigation, query, SORT_OPTIONS, count),
    "pagination": components.createPaginationData(navigation, query, count, translation),
    "documents": documents,
    "facets": facets,
  };
}

function prepareDocumentsInPlace(translation, navigation, documents) {
  const detailNavigation = navigation.changeView(ROUTE.DATASET_DETAIL);
  for (const document of documents) {
    document["href"] = detailNavigation.linkFromServer({ "iri": document["iri"] });
    for (const format of document["format"] ?? []) {
      format.tooltip = translation.translate("format-tooltip", format.label);
    }
  }
}

function prepareFacets(translation, navigation, query, facets, counts) {
  const result = [];
  if (query.isPartOf.length > 0) {
    const name = "isPartOf";
    const facetData = facets[name];
    const facetLabel = translation.translate(FACET_SERIES.name);
    const facetTooltip = translation.translate(FACET_SERIES.tooltip);
    result.push(components.createFacetData(
      navigation, query, facetData, name, facetLabel, facetTooltip,
      query.isPartOf.length, translation));
  }
  for (const { name, tooltip } of FACETS) {
    const facetData = facets[name];
    const facetLabel = translation.translate(name);
    const facetTooltip = tooltip === undefined ? undefined :
      translation.translate(tooltip);
    result.push(components.createFacetData(
      navigation, query, facetData, name, facetLabel, facetTooltip,
      counts[name], translation));
  }
  return result;
}

// -- View -----------------------------------------------------------------

export function renderDatasetListHtml(
  state: DatasetListState,
  language: "cs" | "en",
): string {
  const head = renderToHtml(<DatasetListHead state={state} />);
  const main = renderToHtml(<DatasetListMain state={state} language={language} />);
  return (
    "<!DOCTYPE html>\n" +
    `<html dir="ltr" lang="${language}">\n` +
    `<head>\n${head}\n</head>\n` +
    `<body>\n${state.headerHtml}\n${main}\n${state.footerHtml}\n</body>\n` +
    "</html>\n"
  );
}

function windowSearchScript(state: DatasetListState): string {
  return (
    "\n          window.search = {\n" +
    '            "localization": {\n' +
    `              "searchQuery": ${JSON.stringify(state.jsSearchQuery)},\n` +
    `              "temporalFrom": ${JSON.stringify(state.jsTemporalFrom)},\n` +
    `              "temporalTo": ${JSON.stringify(state.jsTemporalTo)},\n` +
    `              "publicData": ${JSON.stringify(state.jsPublicData)},\n` +
    `              "codelist": ${JSON.stringify(state.jsCodelist)},\n` +
    "            },\n" +
    `            "query": ${state.search.queryObjectAsString},\n` +
    "          };\n" +
    "        "
  );
}

function DatasetListHead({ state }: { state: DatasetListState }) {
  return (
    <>
      <Head state={state.head} />
      <title>{state.pageTitle}</title>
      <meta name="description" content={state.pageDescription} />
      <link rel="canonical" href="/datasets" />
      <link rel="alternate" href="/datové-sady" hreflang="cs" />
      <link rel="alternate" href="/datasets" hreflang="en" />
      <link
        type="text/css"
        rel="stylesheet"
        href="/assets/catalog/css/resource-list.css"
      />
      <link
        type="text/css"
        rel="stylesheet"
        href="/assets/catalog/css/dataset-list.css"
      />
      <script src="/assets/catalog/js/dataset-list.js"></script>
    </>
  );
}

function DatasetListMain({
  state,
  language,
}: {
  state: DatasetListState;
  language: Language;
}) {
  return (
    <gov-container class="datasets-container">
      <gov-grid>
        <gov-grid-item size-sm="12/12" size-md="4/12">
          {state.facets.map((facet) => (
            <Facet state={facet} />
          ))}
        </gov-grid-item>
        <gov-grid-item size-sm="12/12" size-md="8/12" class="p-2">
          <gov-form-search
            variant="primary"
            id="search"
            data-query="dotaz"
            data-base-url={state.search["base-url"]}
          >
            <gov-form-input
              slot="input"
              size="m"
              placeholder={state.searchPlaceholder}
              wcag-label={state.searchInputLabel}
              value={state.search.query.searchQuery ?? ""}
              data-type="query"
            ></gov-form-input>
            <gov-button
              slot="button"
              variant="primary"
              size="s"
              wcag-label={state.wcagSearch}
              data-type="submit"
            >
              {" "}
              {state.searchButton}{" "}
            </gov-button>
          </gov-form-search>
          <gov-accordion size="xs" wcag-label={state.extendedSearch}>
            <gov-accordion-item>
              <h3 slot="label">{state.extendedSearch}</h3>
              <div class="extended-search">
                <div class="time-coverage mb-2">
                  <div class="time-inputs">
                    {" "}
                    {state.temporalFrom}{" "}
                    <gov-form-input
                      input-type="date"
                      data-type="time-from"
                      value={state.search.query.temporalFrom ?? ""}
                    ></gov-form-input>
                    {" "}
                    {state.temporalTo}{" "}
                    <gov-form-input
                      input-type="date"
                      data-type="time-to"
                      value={state.search.query.temporalTo ?? ""}
                    ></gov-form-input>
                  </div>
                  <div class="flex-justify-end time-buttons">
                    <gov-button variant="primary" size="m" data-type="this-year">
                      {state.thisYear}
                    </gov-button>
                    <gov-button variant="primary" size="m" data-type="last-year">
                      {state.lastYear}
                    </gov-button>
                  </div>
                </div>
                <div class="flex-space-between">
                  <gov-button
                    variant="warning"
                    size="m"
                    href={state.search["clear-href"]}
                    wcag-label={state.clearFiltersLabel}
                  >
                    {" "}
                    {state.clearFilters}{" "}
                  </gov-button>
                  <gov-button
                    variant="primary"
                    size="m"
                    wcag-label={state.searchButton}
                    data-type="submit"
                  >
                    {" "}
                    {state.searchButton}{" "}
                  </gov-button>
                </div>
              </div>
            </gov-accordion-item>
          </gov-accordion>
          <script
            dangerouslySetInnerHTML={{ __html: windowSearchScript(state) }}
          ></script>
          <QuerySection state={state["query-section"]} language={language} />
          <ResultBar state={state["result-bar"]} />
          <hr />
          <div class="p-2 resource-list">
            {state.documents.map((document) => (
              <DatasetCard document={document} state={state} />
            ))}
          </div>
          <Pagination state={state.pagination} />
        </gov-grid-item>
      </gov-grid>
    </gov-container>
  );
}

function DatasetCard({
  document,
  state,
}: {
  document: DatasetListDocument;
  state: DatasetListState;
}) {
  return (
    <>
      <div class="p-2 resource-list-item">
        <a href={document.href ?? ""} class="flex-space-between">
          <h3 class="inline">
            {" "}
            {document.title}{" "}
          </h3>
          <gov-icon name="chevron-right"></gov-icon>
        </a>
        <p
          class="description-preview"
          dangerouslySetInnerHTML={{
            __html: " " + breakLines(document.description) + " ",
          }}
        ></p>
        <div>
          {document.isHvd ? (
            <gov-tooltip>
              <gov-chip variant="error" type="outlined" size="xs">
                {" "}
                HVD{" "}
              </gov-chip>
              <gov-tooltip-content>
                {" "}
                {state.hvdTooltip}{" "}
              </gov-tooltip-content>
            </gov-tooltip>
          ) : null}
          {document.isOpenData ? (
            <gov-chip variant="success" type="outlined" size="xs">
              {" "}
              {state.openData}{" "}
            </gov-chip>
          ) : null}
          {document.isNonPublicData ? (
            <gov-chip variant="warning" type="outlined" size="xs">
              {" "}
              {state.nonPublicData}{" "}
            </gov-chip>
          ) : null}
          {document.isDynamicData ? (
            <gov-tooltip>
              <gov-chip variant="warning" type="outlined" size="xs">
                {" "}
                {state.dynamicChip}{" "}
              </gov-chip>
              <gov-tooltip-content>
                {" "}
                {state.dynamicTooltip}{" "}
              </gov-tooltip-content>
            </gov-tooltip>
          ) : null}
          {document.format.map((format) => (
            <gov-tooltip>
              <gov-chip variant="primary" type="outlined" size="xs">
                {" "}
                {format.label}{" "}
              </gov-chip>
              <gov-tooltip-content>
                {" "}
                {format.tooltip}{" "}
              </gov-tooltip-content>
            </gov-tooltip>
          ))}
        </div>
      </div>
      <hr />
    </>
  );
}
