import { FastifyReply } from "fastify";

import { ROUTE } from "../route-name.mjs";
import * as components from "../../component/index.mjs";
import { Head } from "../../component/head.tsx";
import { headerHtml } from "../../component/header.ts";
import { footerHtml } from "../../component/footer.ts";
import { ListSearchPage } from "../../component/list-search-page.tsx";
import { renderToHtml } from "../../html/render-html.ts";
import { breakLines } from "../../html/escape.ts";
import type { Configuration } from "../../configuration.ts";
import type { TranslationService } from "../../service/translation-service.ts";
import type { NavigationEntry } from "../../service/navigation-service.ts";
import type { Language } from "../../localization/index.ts";
import type { ViewContext } from "../../service/view-context.ts";
import type {
  SuggestionListData,
  SuggestionListDocument,
  SuggestionListQuery,
  SuggestionListState,
  SuggestionListViewServices,
} from "./suggestion-list-state.ts";
import { isSuggestionListQueryEmpty } from "./suggestion-list-query.ts";

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
  const ctx: ViewContext = {
    t: services.translation.t,
    language: languages[0],
    navigation: services.navigation,
  };
  const html = renderSuggestionListHtml(state, ctx);
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
  prepareDocumentsInPlace(navigation, documents);
  const suggestionCount = data["found"]["documents"];
  return {
    "head": components.createHeadData(configuration),
    "clearFilters":
      isSuggestionListQueryEmpty(query) ? null : navigation.linkFromServer({}),
    "search": { "query": { "searchQuery": query.searchQuery } },
    "navigation": {
      "url": navigation.linkFromServer({ ...query, "page": 0 }),
      "searchName": navigation.queryNameFromServer("query"),
    },
    "resultBar": components.createResultBarData(translation, navigation, query, SORT_OPTIONS, suggestionCount),
    "pagination": components.createPaginationData(navigation, query, suggestionCount),
    "documents": documents,
    "facets": prepareFacets(translation, navigation, query, data["facets"], data["found"]),
    "query": query,
  };
}

function prepareDocumentsInPlace(navigation: NavigationEntry, suggestions: SuggestionListDocument[]) {
  const suggestionDetailNavigation = navigation.changeView(ROUTE.SUGGESTION_DETAIL);
  for (const suggestion of suggestions) {
    suggestion["href"] = suggestionDetailNavigation.linkFromServer({
      "iri": suggestion["iri"]
    });
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
  ctx: ViewContext,
): string {
  return `<!DOCTYPE html>
  <html dir="ltr" lang="${ctx.language}">
  <head>${renderToHtml(<SuggestionListHead state={state} ctx={ctx} />)}</head>
  <body>
    <div class="gov-story-theme-scope">
      ${headerHtml(ctx.navigation, ctx.language, state.query)}
      ${renderToHtml(<SuggestionListMain state={state} ctx={ctx} />)}
      ${footerHtml(ctx.language)}
    </div>
  </body>
  </html>`;
}

function SuggestionListHead({ state, ctx }: {
  state: SuggestionListState,
  ctx: ViewContext,
}) {
  return (
    <>
      <Head state={state.head} />
      <title>{ctx.t("page-title")}</title>
      <meta name="description" content={ctx.t("page-description")} />
      <link rel="canonical" href="/suggestions-for-datasets-to-be-opened" />
      <link rel="alternate" href="/návrhy-na-datové-sady-k-otevření" hreflang="cs" />
      <link rel="alternate" href="/suggestions-for-datasets-to-be-opened" hreflang="en" />
    </>
  );
}

function SuggestionListMain({ state, ctx }: {
  state: SuggestionListState,
  ctx: ViewContext,
}) {
  return (
    <ListSearchPage state={{
      searchQuery: state.search.query.searchQuery,
      navigationUrl: state.navigation.url,
      searchNavigationName: state.navigation.searchName,
      facets: state.facets,
      resultBar: state.resultBar,
      clearFilters: state.clearFilters,
      items: state.documents,
      pagination: state.pagination,
      component: SuggestionItem,
    }} ctx={ctx} />
  );
}

function SuggestionItem({ value }: {
  value: SuggestionListDocument,
  ctx: ViewContext,
}) {
  const headlineId = "suggestion-" + encodeURIComponent(value.iri);
  const description = " " + breakLines(value.description) + " ";
  return (
    <article>
      <gov-card direction="horizontal" href={value.href} aria-labelledby={headlineId}>
        <gov-flex gap="s" direction="column">
          <header>
            <h3 id={headlineId} class="gov-card__headline">
              {value.title}
            </h3>
          </header>
          <p class="line-clamp-3" dangerouslySetInnerHTML={{ __html: description }} />
          {value.themes.length === 0 ? null : (
            <ul class="gov-tags gov-list--plain">
              {value.themes.map(theme => (
                <li>
                  <gov-tag color="neutral" type="subtle" size="xs">
                    {theme.label}
                  </gov-tag>
                </li>
              ))}
            </ul>
          )}
        </gov-flex>
      </gov-card>
    </article>
  );
}
