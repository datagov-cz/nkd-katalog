import { ROUTE } from "../route-name.mjs";
import * as components from "../../component/index.mjs";

/**
 * @typedef {{
 *   configuration: import('../../configuration.ts').Configuration,
 *   navigation: import('../../service/navigation-service.mjs').IViewBoundNavigation,
 *   template: import('../../handlebars/index.ts').HandlebarsService,
 *   http: any,
 * }} ApplicationDetailViewServices
 *
 * @typedef {{
 *   head: import('../../component/head.ts').HeadData,
 *   navigation: import('../../component/navigation.mjs').NavigationData,
 *   footer: import('../../component/footer.mjs').FooterData,
 *   application: {
 *     author: { title: string | null, titleVisible: boolean, iri: string | null, iriVisible: boolean },
 *     title: string,
 *     description: string,
 *     states: Array<{ iri: string, label: string, href: string }>,
 *     themes: Array<{ iri: string, label: string, href: string }>,
 *     platforms: Array<{ iri: string, label: string, href: string }>,
 *     types: Array<{ iri: string, label: string, href: string }>,
 *     published: string,
 *     modified: string,
 *     link: string,
 *   },
 *   datasets: { visible: boolean, items: Array<{ iri: string, title: string, description: string, href: string }> },
 * }} ApplicationDetailTemplateData
 */

/**
 * @param {ApplicationDetailViewServices} services
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
  const template = services.template.view(ROUTE.APPLICATION_DETAIL);
  reply
    .code(200)
    .header("Content-Type", "text/html; charset=utf-8")
    .send(template(templateData));
}

/**
 * @param {ApplicationDetailViewServices} services
 * @param {string[]} languages
 * @param {any} query
 * @param {any} data
 * @returns {ApplicationDetailTemplateData}
 */
export function prepareTemplateData(services, languages, query, data) {
  const language = languages[0];
  const datasets = data["datasets"];
  prepareDatasetsInPlace(services.navigation, data["datasets"]);
  const application = prepareApplication(services.navigation, language, data);
  return {
    "head": components.createHeadData(services.configuration),
    "navigation": components.createNavigationData(services.navigation, languages, query),
    "footer": components.createFooterData(),
    "application": application,
    "datasets": {
      "visible": datasets.length > 0,
      "items": datasets,
    },
  };
}

function prepareDatasetsInPlace(navigation, datasets) {
  const listNavigation = navigation.changeView(ROUTE.DATASET_DETAIL);
  for (const dataset of datasets) {
    dataset["href"] = listNavigation.linkFromServer({ "iri": dataset["iri"] });
  }
}

function prepareApplication(navigation, language, application) {
  const authorTitle = application["author"]["title"];
  const authorIri = application["author"]["iri"];

  updateCodelistInPlace(navigation, application["states"], "state");
  updateCodelistInPlace(navigation, application["themes"], "theme");
  updateCodelistInPlace(navigation, application["platforms"], "platform");
  updateCodelistInPlace(navigation, application["types"], "type");

  return {
    "author": {
      "title": authorTitle,
      "titleVisible": authorTitle !== null,
      "iri": authorIri,
      "iriVisible": authorIri !== null,
    },
    "title": application["title"],
    "description": application["description"],
    "states": application["states"],
    "themes": application["themes"],
    "platforms": application["platforms"],
    "types": application["types"],
    "published": formatDate(language, application["published"]),
    "modified": formatDate(language, application["modified"]),
    "link": application["link"],
  }
}

function formatDate(language, value) {
  if (value === null) {
    return "-";
  }
  return value.toLocaleDateString(language);
}

function updateCodelistInPlace(navigation, items, name) {
  const listNavigation = navigation.changeView(ROUTE.APPLICATION_LIST);
  for (const item of items) {
    item["href"] = listNavigation.linkFromServer({ [name]: item["iri"] });
  }
}
