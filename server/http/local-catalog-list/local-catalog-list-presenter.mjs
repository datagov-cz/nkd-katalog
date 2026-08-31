import { ROUTE } from "../route-name.mjs";
import { createTranslationService } from "../../service/translation-service.ts";
import { prepareData } from "./local-catalog-list-model.mjs";
import { renderHtml } from "./local-catalog-list-view-html.tsx";
import localization from "./local-catalog-list-localization.mjs";

/**
 * @param {import('../../service/service.mjs').Services & {http: any}} services
 * @param {('cs' | 'en')[]} languages
 * @returns {{ path: string, handler: (request: any, reply: any) => Promise<void> }}
 */
export default function createHandler(services, languages) {
  const language = languages[0];
  // Navigation and translation.
  const local = localization[language];
  const navigation = services.navigation.view(language, ROUTE.LOCAL_CATALOG_LIST)
    .setNavigationData(local);
  // The view is JSX (`local-catalog-list-view-html.tsx`); no Handlebars
  // template to register.
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
  const data = await prepareData(services, languages);
  const serverQuery = {}; // We do not support query here yet.
  renderHtml(services, languages, serverQuery, data, reply);
}
