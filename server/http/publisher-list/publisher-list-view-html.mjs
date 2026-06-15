import { ROUTE } from "../route-name.mjs";
import * as components from "../../component/index.mjs";

/**
 * @typedef {{
 *   configuration: import('../../configuration.ts').Configuration,
 *   translation: import('../../service/translation-service.ts').TranslationService,
 *   navigation: import('../../service/navigation-service.ts').NavigationEntry,
 *   template: import('../../handlebars/index.ts').HandlebarsService,
 * }} PublisherListViewServices
 *
 * @typedef {{
 *   head: import('../../component/head.ts').HeadData,
 *   navigation: import('../../component/navigation.mjs').NavigationData,
 *   footer: import('../../component/footer.mjs').FooterData,
 *   message: string,
 *   publishers: Array<{
 *     iri: string,
 *     label: string,
 *     count: number,
 *     href: string,
 *     dashboardDaily: string,
 *     dashboardMonthly: string,
 *     message: string,
 *     badges: { vdf: boolean, vdfOriginator: boolean, vdfPublisher: boolean },
 *   }>,
 * }} PublisherListTemplateData
 */

/**
 * @param {PublisherListViewServices} services
 * @param {('cs' | 'en')[]} languages
 * @param {any} query
 * @param {any} data
 * @param {any} reply
 */
export function renderHtml(services, languages, query, data, reply) {
  const templateData = prepareTemplateData(
    services.configuration, services.navigation,
    services.translation, languages, query, data);
  const template = services.template.view(ROUTE.PUBLISHER_LIST);
  reply
    .code(200)
    .header("Content-Type", "text/html; charset=utf-8")
    .send(template(templateData));
}

/**
 * @param {import('../../configuration.ts').Configuration} configuration
 * @param {import('../../service/navigation-service.ts').NavigationEntry} navigation
 * @param {import('../../service/translation-service.ts').TranslationService} translation
 * @param {('cs' | 'en')[]} languages
 * @param {any} query
 * @param {any} data
 * @returns {PublisherListTemplateData}
 */
export function prepareTemplateData(configuration, navigation, translation, languages, query, data) {
  preparePublishersInPlace(configuration, navigation, translation, data["publishers"])
  return {
    "head": components.createHeadData(configuration),
    "navigation": components.createNavigationData(navigation, languages, query, { publishersActive: true }),
    "footer": components.createFooterData(),
    "message": translation.translate("items-found", data["publishers"].length),
    "publishers": data["publishers"],
  };
}

function preparePublishersInPlace(configuration, navigation, translation, publishers) {
  const datasetListNavigation = navigation.changeView(ROUTE.DATASET_LIST);
  for (const publisher of publishers) {
    publisher["href"] = datasetListNavigation.linkFromServer({
      "publisher": publisher["iri"]
    });
    publisher["dashboardDaily"] =
      configuration.client.publisherDashboardDailyTemplate
        .replace("{}", publisher["iri"]);
    publisher["dashboardMonthly"] =
      configuration.client.publisherDashboardMonthlyTemplate
        .replace("{}", publisher["iri"]);
    publisher.message =
      translation.translate("datasets-found", publisher.count);
    //
    publisher.badges = {
      "vdf": publisher.vdfOriginator || publisher.vdfPublisher,
      "vdfOriginator": publisher.vdfOriginator,
      "vdfPublisher": publisher.vdfPublisher,
    };
  }
}


