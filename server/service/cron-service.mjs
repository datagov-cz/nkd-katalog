import cron from "node-cron";

import logger from "../logger.ts";

/**
 * @typedef {{ initialize: () => void }} CronService
 */

/**
 * @param {import('../configuration.ts').Configuration} configuration
 * @param {import('./label-service.ts').LabelService} labelService
 * @returns {CronService}
 */
export function createCronService(configuration, labelService) {
  return {
    /**
     * Setup all time-based actions.
     */
    "initialize": () => initialize(configuration, labelService),
  };
}

/**
 * @param {import('../configuration.ts').Configuration} configuration
 * @param {import('./label-service.ts').LabelService} labelService
 */
function initialize(configuration, labelService) {
  if (isNotEmpty(configuration.server.labelReloadCron)) {
    logger.info("Cache reload registered.")
    cron.schedule(configuration.server.labelReloadCron, () => {
      labelService.reloadCache(["cs", "en"]);
    });
  }
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isNotEmpty(value) {
  return value !== undefined && value !== null && value !== "";
}
