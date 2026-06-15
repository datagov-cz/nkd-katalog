import createV2Statistics from "./api/v2/statistics/api-v2-statistics.mjs";
import createV2Quality from "./api/v2/quality/api-v2-quality-presenter.mjs";

import createApplicationList from "./application-list/application-list-presenter.mjs";
import createApplicationDetail from "./application-detail/application-detail-presenter.mjs";
import createSuggestionList from "./suggestion-list/suggestion-list-presenter.mjs";
import createSuggestionDetail from "./suggestion-detail/suggestion-detail-presenter.mjs";
import createStatusHandlers from "./http-status-handlers/http-status-handlers.mjs";
import createPublisherList from "./publisher-list/publisher-list-presenter.mjs";
import createLocalCatalogList from "./local-catalog-list/local-catalog-list-presenter.mjs";
import createDatasetList from "./dataset-list/dataset-list-presenter.mjs";
import createDatasetDetail from "./dataset-detail/dataset-detail-presenter.mjs";

import { createTemplateService } from "../service/template-service.ts";
import { registerComponents } from "../component/index.mjs";

/**
 * @param {import('fastify').FastifyInstance} server
 * @param {import('../service/service.mjs').Services} services
 */
export function registerHttpRoutes(server, services) {
  const templateCs = createAndPreloadTemplateService("cs");
  const templateEn = createAndPreloadTemplateService("en");

  const httpStatusHandlers = createStatusHandlers([templateCs, templateEn]);
  const webServices = {
    ...services,
    "http": httpStatusHandlers,
  };

  // API version 2.

  registerHandler(server, createV2Quality(services));
  registerHandler(server, createV2Statistics(services))

  // Application list.

  const applicationListCs = createApplicationList(
    webServices, templateCs, ["cs", "en"]);
  registerHandler(server, applicationListCs);

  const applicationListEn = createApplicationList(
    webServices, templateEn, ["en", "cs"]);
  registerHandler(server, applicationListEn);

  // Application detail.

  const applicationDetailCs = createApplicationDetail(
    webServices, templateCs, ["cs", "en"]);
  registerHandler(server, applicationDetailCs);

  const applicationDetailEn = createApplicationDetail(
    webServices, templateEn, ["en", "cs"]);
  registerHandler(server, applicationDetailEn);

  // Suggestion list.

  const suggestionListCs = createSuggestionList(
    webServices, templateCs, ["cs", "en"]);
  registerHandler(server, suggestionListCs);

  const suggestionListEn = createSuggestionList(
    webServices, templateEn, ["en", "cs"]);
  registerHandler(server, suggestionListEn);

  // Suggestion detail.

  const suggestionDetailCs = createSuggestionDetail(
    webServices, templateCs, ["cs", "en"]);
  registerHandler(server, suggestionDetailCs);

  const suggestionDetailEn = createSuggestionDetail(
    webServices, templateEn, ["en", "cs"]);
  registerHandler(server, suggestionDetailEn);

  // Publisher list.

  const publisherListCs = createPublisherList(
    webServices, templateCs, ["cs", "en"]);
  registerHandler(server, publisherListCs);

  const publisherListEn = createPublisherList(
    webServices, templateEn, ["en", "cs"]);
  registerHandler(server, publisherListEn);

  // Local catalog list.

  const localCatalogListCs = createLocalCatalogList(
    webServices, templateCs, ["cs", "en"]);
  registerHandler(server, localCatalogListCs);

  const localCatalogListEn = createLocalCatalogList(
    webServices, templateEn, ["en", "cs"]);
  registerHandler(server, localCatalogListEn);

  // Dataset list.

  const datasetListCs = createDatasetList(
    webServices, templateCs, ["cs", "en"]);
  registerHandler(server, datasetListCs);

  const datasetListEn = createDatasetList(
    webServices, templateEn, ["en", "cs"]);
  registerHandler(server, datasetListEn);

  // Dataset detail.

  const datasetDetailCs = createDatasetDetail(
    webServices, templateCs, ["cs", "en"]);
  registerHandler(server, datasetDetailCs);

  const datasetDetailEn = createDatasetDetail(
    webServices, templateEn, ["en", "cs"]);
  registerHandler(server, datasetDetailEn);

  //

  server.setErrorHandler(function (error, request, reply) {
    this.log.error(error);
    httpStatusHandlers.handlerError(reply);
  });

  server.setNotFoundHandler(function (request, reply) {
    httpStatusHandlers.handlePathNotFound(reply);
  });

}

function registerHandler(server, handler) {
  server.route({
    method: "GET",
    url: "/" + handler.path,
    handler: handler.handler,
  });
}

function createAndPreloadTemplateService(language) {
  const service = createTemplateService("./server/");
  registerComponents(service, language);
  return service;
}
