import { FastifyReply } from "fastify";

import { ROUTE } from "../route-name.mjs";
import * as components from "../../component/index.mjs";
import { Head } from "../../component/head.tsx";
import { Facet } from "../../component/facet.tsx";
import { ResultBar } from "../../component/result-bar.tsx";
import { Pagination } from "../../component/pagination.tsx";
import { headerHtml } from "../../component/header.ts";
import { footerHtml } from "../../component/footer.ts";
import { renderToHtml } from "../../html/render-html.ts";
import { breakLines } from "../../html/escape.ts";
import type { Configuration } from "../../configuration.ts";
import type { TranslationService } from "../../service/translation-service.ts";
import type { NavigationEntry } from "../../service/navigation-service.ts";
import type { Language } from "../../localization/index.ts";
import type {
  SuggestionListData,
  SuggestionListDocument,
  SuggestionListQuery,
  SuggestionListState,
  SuggestionListViewServices,
} from "./suggestion-list-state.ts";

const FACETS = [
  { "name": "state", "tooltip": "stateTooltip" },
  { "name": "theme", "tooltip": "themeTooltip" },
  { "name": "publisher", "tooltip": "publisherTooltip" },
];

const SORT_OPTIONS = [
  ["title", "asc"],
  ["title", "desc"],
  ["created", "asc"],
  ["created", "desc"],
];

export function renderHtml(
  services: SuggestionListViewServices,
  languages: Language[],
  query: SuggestionListQuery,
  data: SuggestionListData,
  reply: FastifyReply,
): void {
  const state = prepareTemplateData(
    services.configuration, services.translation, services.navigation, languages, query, data);
  const html = renderSuggestionListHtml(state, languages[0]);
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
  query: SuggestionListQuery,
  data: SuggestionListData,
): SuggestionListState {
  const documents = data["documents"];
  prepareDocumentsInPlace(translation, navigation, documents);
  const suggestionCount = data["found"]["documents"];
  const dictionary = translation.dictionary;
  return {
    "head": components.createHeadData(configuration),
    "headerHtml": headerHtml(navigation, languages[0], query),
    "footerHtml": footerHtml(languages[0]),
    "pageTitle": dictionary["page-title"],
    "pageDescription": dictionary["page-description"],
    "searchPlaceholder": dictionary["search-placeholder"],
    "searchInputLabel": dictionary["search-input-label"],
    "searchButtonLabel": dictionary["search-button-label"],
    "searchButton": dictionary["search-button"],
    "extendedSearch": dictionary["extended-search"],
    "clearFiltersLabel": dictionary["clear-filters-label"],
    "clearFilters": dictionary["clear-filters"],
    "search": {
      "value": query.searchQuery,
      "clear-href": navigation.linkFromServer({}),
      "search-href": navigation.linkFromServer({ ...query, "searchQuery": "_QUERY_", "page": 0 }),
    },
    "result-bar": components.createResultBarData(translation, navigation, query, SORT_OPTIONS, suggestionCount),
    "pagination": components.createPaginationData(navigation, query, suggestionCount, translation),
    "documents": documents,
    "facets": prepareFacets(translation, navigation, query, data["facets"], data["found"]),
  };
}

function prepareDocumentsInPlace(translation, navigation, suggestions) {
  const suggestionDetailNavigation = navigation.changeView(ROUTE.SUGGESTION_DETAIL);
  for (const suggestion of suggestions) {
    suggestion["href"] = suggestionDetailNavigation.linkFromServer({
      "iri": suggestion["iri"]
    });
    for (const theme of suggestion["themes"] ?? []) {
      theme.tooltip = translation.translate("theme-tooltip", theme.label);
    }
  }
}

function prepareFacets(translation, navigation, query, facets, counts) {
  const result = [];
  for (const { name, tooltip } of FACETS) {
    const facetData = facets[name];
    const facetLabel = translation.translate(name);
    const facetTooltip = translation.translate(tooltip);
    result.push(components.createFacetData(
      navigation, query, facetData, name, facetLabel, facetTooltip,
      counts[name], translation));
  }
  return result;
}

// -- View -----------------------------------------------------------------

export function renderSuggestionListHtml(
  state: SuggestionListState,
  language: "cs" | "en",
): string {
  const head = renderToHtml(<SuggestionListHead state={state} />);
  const main = renderToHtml(<SuggestionListMain state={state} />);
  return (
    "<!DOCTYPE html>\n" +
    `<html dir="ltr" lang="${language}">\n` +
    `<head>\n${head}\n</head>\n` +
    `<body>\n${state.headerHtml}\n${main}\n${state.footerHtml}\n</body>\n` +
    "</html>\n"
  );
}

function SuggestionListHead({ state }: { state: SuggestionListState }) {
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
      <script src="/assets/catalog/js/suggestion-list.js"></script>
    </>
  );
}

function SuggestionListMain({ state }: { state: SuggestionListState }) {
  return (
    <gov-container class="suggestions-container">
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
            href={state.search["search-href"]}
          >
            <gov-form-input
              slot="input"
              size="m"
              placeholder={state.searchPlaceholder}
              wcag-label={state.searchInputLabel}
              value={state.search.value ?? ""}
            ></gov-form-input>
            <gov-button
              slot="button"
              variant="primary"
              size="s"
              wcag-label={state.searchButtonLabel}
            >
              {" "}
              {state.searchButton}{" "}
            </gov-button>
          </gov-form-search>
          <gov-accordion size="xs">
            <gov-accordion-item>
              <h3 slot="label">{state.extendedSearch}</h3>
              <div class="extended-search">
                <gov-button
                  slot="button"
                  variant="warning"
                  size="m"
                  href={state.search["clear-href"]}
                  wcag-label={state.clearFiltersLabel}
                >
                  {" "}
                  {state.clearFilters}{" "}
                </gov-button>
              </div>
            </gov-accordion-item>
          </gov-accordion>
          <ResultBar state={state["result-bar"]} />
          <hr />
          <div class="p-2 resource-list">
            {state.documents.map((document) => (
              <SuggestionCard document={document} />
            ))}
          </div>
          <Pagination state={state.pagination} />
        </gov-grid-item>
      </gov-grid>
    </gov-container>
  );
}

function SuggestionCard({ document }: { document: SuggestionListDocument }) {
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
          {document.themes.map((theme) => (
            <gov-tooltip>
              <gov-chip variant="primary" type="outlined" size="xs">
                {" "}
                {theme.label}{" "}
              </gov-chip>
              <gov-tooltip-content>
                {" "}
                {theme.tooltip}{" "}
              </gov-tooltip-content>
            </gov-tooltip>
          ))}
        </div>
      </div>
      <hr />
    </>
  );
}
