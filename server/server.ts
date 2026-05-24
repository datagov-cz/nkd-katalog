import configuration from "./configuration";
import {
  createHttpServer,
  registerRoutes,
  startServer,
} from "./http/http-server.mjs";
import { createHttpConnector } from "./connector/http-connector";
import { createServices } from "./service/service.mjs";

(async function main() {
  const server = await createHttpServer(configuration);
  const http = createHttpConnector();
  const services = await createServices(configuration, http);
  registerRoutes(configuration, server, services);
  startServer(server, configuration);
})();
