import cron from "node-cron";

import logger from "../logger";

export function createCronService(configuration, labelService) {
  return {
    /**
     * Setup all time-based actions.
     */
    "initialize": () => initialize(configuration, labelService),
  };
}

function initialize(configuration, labelService) {
  if (isNotEmpty(configuration.server.labelReloadCron)) {
    logger.info("Cache reload registered.")
    cron.schedule(configuration.server.labelReloadCron, () => {
      labelService.reloadCache(["cs", "en"]);
    });
  }
}

function isNotEmpty(value) {
  return value !== undefined && value !== null && value !== "";
}
