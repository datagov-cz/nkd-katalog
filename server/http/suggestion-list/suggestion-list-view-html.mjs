import { ROUTE } from "../route-name.mjs";
import * as components from "../../component/index.mjs";

/**
 * @typedef {{
 *   configuration: import('../../configuration.ts').Configuration,
 *   translation: import('../../service/translation-service.ts').TranslationService,
 *   navigation: import('../../service/navigation-service.ts').NavigationEntry,
 *   template: import('../../handlebars/index.ts').HandlebarsService,
 * }} SuggestionListViewServices
 *
 * @typedef {{
 *   head: import('../../component/head.ts').HeadData,
 *   navigation: import('../../component/navigation.mjs').NavigationData,
 *   footer: import('../../component/footer.mjs').FooterData,
 *   search: { value: string | null, "clear-href": string, "search-href": string },
 *   "result-bar": import('../../component/result-bar.mjs').ResultBarData,
 *   pagination: import('../../component/pagination.mjs').PaginationData,
 *   documents: Array<{ iri: string, title: string, description: string, href: string, themes: Array<{ iri: string, label: string, href: string }> }>,
 *   facets: import('../../component/facet.mjs').FacetData[],
 * }} SuggestionListTemplateData
 */

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

/**
 * @param {SuggestionListViewServices} services
 * @param {('cs' | 'en')[]} languages
 * @param {any} query
 * @param {any} data
 * @param {any} reply
 */
export function renderHtml(services, languages, query, data, reply) {
  const templateData = prepareTemplateData(
    services.configuration, services.translation, services.navigation, languages, query, data);
  const template = services.template.view(ROUTE.SUGGESTION_LIST);
  reply
    .code(200)
    .header("Content-Type", "text/html; charset=utf-8")
    .send(template(templateData));
}

/**
 * @param {import('../../configuration.ts').Configuration} configuration
 * @param {import('../../service/translation-service.ts').TranslationService} translation
 * @param {import('../../service/navigation-service.ts').NavigationEntry} navigation
 * @param {('cs' | 'en')[]} languages
 * @param {any} query
 * @param {any} data
 * @returns {SuggestionListTemplateData}
 */
export function prepareTemplateData(configuration, translation, navigation, languages, query, data) {
  const documents = data["documents"];
  prepareDocumentsInPlace(navigation, documents);
  const applicationCount = data["found"]["documents"];
  return {
    "head": components.createHeadData(configuration),
    "navigation": components.createNavigationData(navigation, languages, query, { suggestionsActive: true }),
    "footer": components.createFooterData(),
    "search": {
      "value": query.searchQuery,
      "clear-href": navigation.linkFromServer({}),
      "search-href": navigation.linkFromServer({ ...query, "searchQuery": "_QUERY_", "page": 0 }),
    },
    "result-bar": components.createResultBarData(translation, navigation, query, SORT_OPTIONS, applicationCount),
    "pagination": components.createPaginationData(navigation, query, applicationCount),
    "documents": documents,
    "facets": prepareFacets(translation, navigation, query, data["facets"], data["found"]),
  };
}

function prepareDocumentsInPlace(navigation, suggestions) {
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
      counts[name]));
  }
  return result;
}
