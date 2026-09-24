import { ROUTE } from "../route-name.mjs";
import { createTranslationService } from "../../service/translation-service.ts";
import { parseDatasetListQuery, beforeLinkCallback } from "./dataset-list-query.ts";
import { prepareData } from "./dataset-list-model.ts";
import { renderHtml } from "./dataset-list-view-html.tsx";
import localization from "./dataset-list-localization.mjs";

/**
 * @param {import('../../service/service.mjs').Services & {http: any}} services
 * @param {('cs' | 'en')[]} languages
 * @returns {{ path: string, handler: (request: any, reply: any) => Promise<void> }}
 */
export default function createHandler(services, languages) {
  const language = languages[0];
  // Navigation and translation.
  const local = localization[language];
  const navigation = services.navigation.view(language, ROUTE.DATASET_LIST)
    .setNavigationData(local)
    .setBeforeLink(beforeLinkCallback);
  // The view is JSX (`dataset-list-view-html.tsx`); no Handlebars template to
  // register.
  // Handler services.
  const handlerServices = {
    ...services,
    "translation": createTranslationService(local.translation),
    "navigation": navigation,
  };
  // Create handler.
  return {
    "path": local.path,
    "handler": (request, reply) =>
      handleRequest(handlerServices, languages, request, reply),
  };
}

async function handleRequest(services, languages, request, reply) {
  const serverQuery = parseDatasetListQuery(services.navigation, request.query);
  const data = await prepareData(services, languages, serverQuery);
  renderHtml(services, languages, serverQuery, data, reply);
}
