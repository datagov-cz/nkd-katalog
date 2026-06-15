import { ROUTE } from "../route-name.mjs";
import { createTranslationService } from "../../service/translation-service.ts";
import { parseClientQuery, beforeLinkCallback } from "./dataset-detail-query.mjs";
import { prepareData } from "./dataset-detail-model.mjs";
import { renderHtml } from "./dataset-detail-view-html.mjs";
import localization from "./dataset-detail-localization.mjs";

/**
 * @param {import('../../service/service.mjs').Services & {http: any}} services
 * @param {import('../../handlebars/index.ts').HandlebarsService} templates
 * @param {string[]} languages
 * @returns {{ path: string, handler: (request: any, reply: any) => Promise<void> }}
 */
export default function createHandler(services, templates, languages) {
  const language = languages[0];
  // Navigation and translation.
  const local = localization[language];
  const navigation = services.navigation.view(language, ROUTE.DATASET_DETAIL)
    .setNavigationData(local)
    .setBeforeLink(beforeLinkCallback);
  // Load templates.
  templates.syncAddView(
    ROUTE.DATASET_DETAIL,
    "/dataset-detail/dataset-detail-" + language + ".html");
  // Handler services.
  const handlerServices = {
    ...services,
    "translation": createTranslationService(local.translation),
    "navigation": navigation,
    "template": templates,
  };
  // Create handler.
  return {
    "path": local.path,
    "handler": (request, reply) =>
      handleRequest(handlerServices, languages, request, reply),
  };
}

async function handleRequest(services, languages, request, reply) {
  const serverQuery = parseClientQuery(services.navigation, request.query);
  const data = await prepareData(services, languages, serverQuery);
  renderHtml(services, languages, serverQuery, data, reply);
}
