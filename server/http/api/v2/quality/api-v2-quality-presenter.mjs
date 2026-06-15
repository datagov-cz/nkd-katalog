import { createTranslationService } from "../../../../service/translation-service.ts";
import local from "./api-v2-quality-presenter-localization.mjs";
import logger from "../../../../logger.ts";

/**
 * @param {import('../../../../service/service.mjs').Services} services
 * @returns {{ path: string, handler: (request: any, reply: any) => Promise<void> }}
 */
export default function createHandler(services) {
  // Handler services.
  const handlerServices = {
    ...services,
    "translation": {
      "cs": createTranslationService(local.cs.translation),
      "en": createTranslationService(local.en.translation),
    },
  };
  // Create handler.
  return {
    "path": "api/v2/catalog/v1/quality",
    "handler": async (request, reply) => {
      try {
        await handleRequest(handlerServices, request, reply);
      } catch (error) {
        logger.error(error, "Quality request failed.");
        reply
          .code(500)
          .header("Content-Type", "application/json; charset=utf-8")
          .send({});
      }
    },
  };
}

async function handleRequest(services, request, reply) {
  const iri = request.query.iri ?? null;
  const languages = selectLanguages(request.query.language);
  const quality = await services.sparqlQuality.fetchQuality(languages, iri);
  const translation = services.translation[languages[0]];
  const payload = createResponse(translation, languages[0], quality);
  reply
    .code(200)
    .header("Content-Type", "application/json; charset=utf-8")
    .send(payload);
}

function selectLanguages(language) {
  if (language === "en") {
    return ["en", "cs"];
  }
  return ["cs", "en"];
}

function createResponse(translation, language, quality) {
  const result = {};
  for (const key of Object.keys(quality)) {
    prepareQualityItem(translation, language, quality, result, key);
  }
  return result;
}

function prepareQualityItem(translation, language, quality, collector, measureName) {
  const measure = quality[measureName];
  if (measure === null) {
    return;
  }
  const translationArgs = {
    "date": measure.lastCheck === null ? "" : new Date(measure.lastCheck).toLocaleString(language),
    "note": measure.note,
  };

  collector[measureName] = {
    value: measure.value,
    message: translation.translate(
      measureName + (measure.value ? "True" : "False"),
      translationArgs
    ),
  };
}
