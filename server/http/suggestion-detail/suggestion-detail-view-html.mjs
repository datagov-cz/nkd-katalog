import { ROUTE } from "../route-name.mjs";
import * as components from "../../component/index.mjs";

/**
 * @typedef {{
 *   configuration: import('../../configuration.ts').Configuration,
 *   navigation: import('../../service/navigation-service.mjs').IViewBoundNavigation,
 *   template: import('../../service/template-service.ts').TemplateService,
 *   http: any,
 * }} SuggestionDetailViewServices
 *
 * @typedef {{
 *   head: import('../../component/head.ts').HeadData,
 *   navigation: import('../../component/navigation.mjs').NavigationData,
 *   footer: import('../../component/footer.mjs').FooterData,
 *   suggestion: {
 *     iri: string,
 *     title: string,
 *     description: string,
 *     themes: Array<{ iri: string, label: string, href: string }>,
 *     state: any,
 *     created: string,
 *     mandatory_106: any,
 *     obstacle_special_regulation: any,
 *     obstacle_106: any,
 *     publisher: { iri: string | null, title: string | null },
 *     publication_plan: string | null,
 *     publication_plan_visible: boolean,
 *   },
 *   datasets: { visible: boolean, items: Array<{ iri: string, title: string, description: string, href: string }> },
 * }} SuggestionDetailTemplateData
 */

/**
 * @param {SuggestionDetailViewServices} services
 * @param {string[]} languages
 * @param {any} query
 * @param {any} data
 * @param {any} reply
 */
export function renderHtml(services, languages, query, data, reply) {
  if (data == null) {
    services.http.handleNotFound(services, reply);
    return;
  }
  const templateData = prepareTemplateData(services, languages, query, data);
  const template = services.template.view(ROUTE.SUGGESTION_DETAIL);
  reply
    .code(200)
    .header("Content-Type", "text/html; charset=utf-8")
    .send(template(templateData));
}

/**
 * @param {SuggestionDetailViewServices} services
 * @param {string[]} languages
 * @param {any} query
 * @param {any} data
 * @returns {SuggestionDetailTemplateData}
 */
export function prepareTemplateData(services, languages, query, data) {
  const language = languages[0];
  const datasets = data["datasets"];
  prepareDatasetsInPlace(services, data["datasets"]);
  const suggestion = prepareSuggestion(services.navigation, language, data);
  return {
    "head": components.createHeadData(services.configuration),
    "navigation": components.createNavigationData(services.navigation, languages, query, true),
    "footer": components.createFooterData(),
    "suggestion": suggestion,
    "datasets": {
      "visible": datasets.length > 0,
      "items": datasets,
    },
  };
}

function prepareDatasetsInPlace(services, datasets) {
  const listNavigation = services.navigation.changeView(ROUTE.DATASET_DETAIL);
  for (const dataset of datasets) {
    dataset["href"] = listNavigation.linkFromServer({ "iri": dataset["iri"] });
  }
}

function prepareSuggestion(navigation, language, suggestion) {
  updateCodelistInPlace(navigation, suggestion["themes"], "theme");
  return {
    "iri": suggestion["iri"],
    "title": suggestion["title"],
    "description": suggestion["description"],
    "themes": suggestion["themes"],
    "state": suggestion["state"],
    "created": formatDate(language, suggestion["created"]),
    "mandatory_106": suggestion["mandatory_106"],
    "obstacle_special_regulation": suggestion["obstacle_special_regulation"],
    "obstacle_106": suggestion["obstacle_106"],
    "publisher": {
      "iri": suggestion["publisher"]["iri"],
      "title": suggestion["publisher"]["title"],
    },
    "publication_plan": suggestion["publication_plan"],
    "publication_plan_visible": isNotEmpty(suggestion["publication_plan"]),
  }
}

function formatDate(language, value) {
  if (value === null) {
    return "-";
  }
  return value.toLocaleDateString(language);
}

function updateCodelistInPlace(navigation, items, name) {
  const listNavigation = navigation.changeView(ROUTE.SUGGESTION_LIST);
  for (const item of items) {
    item["href"] = listNavigation.linkFromServer({ [name]: item["iri"] });
  }
}

function isNotEmpty(value) {
  return value !== undefined && value !== null && value !== "";
}
