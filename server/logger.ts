// https://github.com/pinojs/pino
import pino from "pino";
import { type LoggerOptions } from "pino";

import configuration from "./configuration";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pinoConfiguration: LoggerOptions = {};

if (configuration.development) {
  pinoConfiguration.level = "debug";
  pinoConfiguration["transport"] = {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  };
}

const logger = pino(pinoConfiguration);
export default logger;
