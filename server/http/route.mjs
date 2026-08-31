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

/**
 * @param {import('fastify').FastifyInstance} server
 * @param {import('../service/service.mjs').Services} services
 * @param {} handlerWrap Wrapper to pass the handler trough.
 */
export function registerHttpRoutes(server, services, wrapHandler) {
  const httpStatusHandlers = createStatusHandlers();
  const webServices = {
    ...services,
    "http": httpStatusHandlers,
  };

  // API version 2.

  registerHandler(
    server, wrapHandler(createV2Quality(services)));
  registerHandler(
    server, wrapHandler(createV2Statistics(services)));

  // Application list.

  registerHandler(
    server, wrapHandler(createApplicationList(webServices, ["cs", "en"])));
  registerHandler(
    server, wrapHandler(createApplicationList(webServices, ["en", "cs"])));

  // Application detail.

  registerHandler(
    server, wrapHandler(createApplicationDetail(webServices, ["cs", "en"])));
  registerHandler(
    server, wrapHandler(createApplicationDetail(webServices, ["en", "cs"])));

  // Suggestion list.

  registerHandler(
    server, wrapHandler(createSuggestionList(webServices, ["cs", "en"])));
  registerHandler(
    server, wrapHandler(createSuggestionList(webServices, ["en", "cs"])));

  // Suggestion detail.

  registerHandler(
    server, wrapHandler(createSuggestionDetail(webServices, ["cs", "en"])));
  registerHandler(
    server, wrapHandler(createSuggestionDetail(webServices, ["en", "cs"])));

  // Publisher list.

  registerHandler(
    server, wrapHandler(createPublisherList(webServices, ["cs", "en"])));
  registerHandler(
    server, wrapHandler(createPublisherList(webServices, ["en", "cs"])));

  // Local catalog list.

  registerHandler(
    server, wrapHandler(createLocalCatalogList(webServices, ["cs", "en"])));
  registerHandler(
    server, wrapHandler(createLocalCatalogList(webServices, ["en", "cs"])));

  // Dataset list.

  registerHandler(
    server, wrapHandler(createDatasetList(webServices, ["cs", "en"])));
  registerHandler(
    server, wrapHandler(createDatasetList(webServices, ["en", "cs"])));

  // Dataset detail.

  registerHandler(
    server, wrapHandler(createDatasetDetail(webServices, ["cs", "en"])));
  registerHandler(
    server, wrapHandler(createDatasetDetail(webServices, ["en", "cs"])));

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
    handler,
  });
}
