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
  // We need to initialize those components as they are loaded from an
  // external source.
  await initializeHeader(configuration.server.partialsUrl);
  await initializeFooter(configuration.server.partialsUrl);
  //
  const server = await createHttpServer(configuration);
  const http = createHttpConnector();
  const services = await createServices(configuration, http);
  // `wrapHandler` is the seam for the golden capture harness
  // (`tools/golden/capture.ts`); the plain server passes the handler through
  // untouched so it carries no dependency on `server/capture/` or `tools/`.
  registerRoutes(configuration, server, services, (handler) => handler);
  startServer(server, configuration);
})();
