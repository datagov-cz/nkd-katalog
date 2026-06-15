import { ROUTE } from "../route-name.mjs";
import * as components from "../../component/index.mjs";

/**
 * @typedef {{
 *   configuration: import('../../configuration.ts').Configuration,
 *   translation: import('../../service/translation-service.ts').TranslationService,
 *   navigation: import('../../service/navigation-service.mjs').IViewBoundNavigation,
 *   link: import('../../service/link-service.mjs').LinkService,
 *   template: import('../../service/template-service.ts').TemplateService,
 * }} LocalCatalogListViewServices
 *
 * @typedef {{
 *   head: import('../../component/head.ts').HeadData,
 *   navigation: import('../../component/navigation.mjs').NavigationData,
 *   footer: import('../../component/footer.mjs').FooterData,
 *   message: string,
 *   catalogs: Array<{
 *     iri: string,
 *     title: string,
 *     url: string,
 *     publisher: { iri: string, label: string },
 *     homepageUrl: string,
 *     endpointUrl: string,
 *     deleteUrl: string,
 *     validateUrl: string,
 *   }>,
 * }} LocalCatalogListTemplateData
 */

/**
 * @param {LocalCatalogListViewServices} services
 * @param {string[]} languages
 * @param {any} query
 * @param {any} data
 * @param {any} reply
 */
export function renderHtml(services, languages, query, data, reply) {
  const templateData = prepareTemplateData(services, languages, query, data);
  const template = services.template.view(ROUTE.LOCAL_CATALOG_LIST);
  reply
    .code(200)
    .header("Content-Type", "text/html; charset=utf-8")
    .send(template(templateData));
}

/**
 * @param {LocalCatalogListViewServices} services
 * @param {string[]} languages
 * @param {any} query
 * @param {any} data
 * @returns {LocalCatalogListTemplateData}
 */
export function prepareTemplateData(services, languages, query, data) {
  prepareCatalogsInPlace(services.configuration, services.link, services.translation, data["catalogs"])
  return {
    "head": components.createHeadData(services.configuration),
    "navigation": components.createNavigationData(services.navigation, languages, query, { localCatalogsActive: true }),
    "footer": components.createFooterData(),
    "message": services.translation.translate("items-found", data["catalogs"].length),
    "catalogs": data["catalogs"],
  };
}

function prepareCatalogsInPlace(configuration, link, translation, catalogs) {
  for (const catalog of catalogs) {
    catalog.url = link.wrapLink(catalog.iri);
    catalog.publisher.iri = link.wrapLink(catalog.publisher.iri);
    catalog.homepageUrl = catalog.homepage;
    catalog.endpointUrl = catalog.endpointURL;
    catalog.deleteUrl = configuration.client.catalogFormUrl
      + translation.translate("url-remove-link")
      + encodeURIComponent(catalog.iri);
    catalog.validateUrl = substituteToTemplate(
      configuration.client.catalogValidatorTemplate, catalog.endpointURL);
  }
}

function substituteToTemplate(template, url) {
  return template.replace("{}", encodeURIComponent(url));
}
