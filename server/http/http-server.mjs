import path from "node:path";

import Fastify from "fastify";
import cors from "@fastify/cors";
import logger from "../logger";

import { registerHttpRoutes } from "./route.mjs";

export async function createHttpServer(configuration) {
  const application = Fastify({
    loggerInstance: logger,
    trustProxy: configuration.http.trustProxy,
  });
  await application.register(cors, {
    "origin": true,
  });
  return application;
}

export function registerRoutes(configuration, server, services) {
  if (configuration.server.serverAssets) {
    registerAssetsRoutes(configuration, server);
  }
  registerHttpRoutes(server, services);
}

function registerAssetsRoutes(configuration, server) {
  const directory = path.join(import.meta.dirname, "../../assets");
  logger.info("Serving assets from '%s' directory.", directory);
  server.register(import("@fastify/static"), {
    root: directory,
    prefix: "/assets/catalog/",
    decorateReply: false
  });
  //
  if (configuration.server.designSystemFolder) {
    const directory = path.join(
      import.meta.dirname,
      "/../../",
      configuration.server.designSystemFolder);
    logger.info("Serving design system assets from '%s' directory.", directory);
    server.register(import("@fastify/static"), {
      // root: new URL("file://" + configuration.server.designSystemFolder),
      root: directory,
      prefix: "/assets/design-system/",
      decorateReply: false
    });
  }
}

export function startServer(server, configuration) {
  server.listen({
    port: configuration.http.port,
    host: configuration.http.host,
  }, function (error) {
    if (error) {
      server.log.error(error);
      process.exit(1);
    }
  });
}
