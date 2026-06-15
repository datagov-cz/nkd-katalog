import { ROUTE } from "../route-name.mjs";
import { createTranslationService } from "../../service/translation-service.ts";
import { parseClientQuery } from "./application-detail-query.mjs";
import { prepareData } from "./application-detail-model.mjs";
import { renderHtml } from "./application-detail-view-html.mjs";
import localization from "./application-detail-localization.mjs";

/**
 * @param {import('../../service/service.mjs').Services & {http: any}} services
 * @param {import('../../handlebars/index.ts').HandlebarsService} templates
 * @param {('cs' | 'en')[]} languages
 * @returns {{ path: string, handler: (request: any, reply: any) => Promise<void> }}
 */
export default function createHandler(services, templates, languages) {
  const language = languages[0];
  // Navigation and translation.
  const local = localization[language];
  const navigation = services.navigation.view(language, ROUTE.APPLICATION_DETAIL)
    .setNavigationData(local);

  // Load templates.
  templates.syncAddView(
    ROUTE.APPLICATION_DETAIL,
    "/application-detail/application-detail-" + language + ".html");
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
