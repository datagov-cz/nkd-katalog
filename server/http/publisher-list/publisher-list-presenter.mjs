import { ROUTE } from "../route-name.mjs";
import { createTranslationService } from "../../service/translation-service.ts";
import { prepareData } from "./publisher-list-model.mjs";
import { renderHtml } from "./publisher-list-view-html.mjs";
import localization from "./publisher-list-localization.mjs";

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
  const navigation = services.navigation.view(language, ROUTE.PUBLISHER_LIST)
    .setNavigationData(local);
  // Load templates.
  templates.syncAddView(
    ROUTE.PUBLISHER_LIST,
    "/publisher-list/publisher-list-" + language + ".html");
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
  const data = await prepareData(services, languages);
  const serverQuery = {}; // We do not support query here yet.
  renderHtml(services, languages, serverQuery, data, reply);
}
