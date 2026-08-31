import configuration from "./configuration.ts";
import {
  createHttpServer,
  registerRoutes,
  startServer,
} from "./http/http-server.mjs";
import { createHttpConnector } from "./connector/http-connector.ts";
import { createServices } from "./service/service.mjs";
import { initializeHeader } from "./component/header.ts";
import { initializeFooter } from "./component/footer.ts";

(async function main() {
  await initializeHeader(configuration.server.partialsUrl);
  await initializeFooter(configuration.server.partialsUrl);
  //
  const server = await createHttpServer(configuration);
  const http = createHttpConnector();
  const services = await createServices(configuration, http);
  registerRoutes(configuration, server, services, (handler) => handler);
  startServer(server, configuration);
})();
