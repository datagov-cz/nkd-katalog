// https://github.com/pinojs/pino
import pino from "pino";
import { type LoggerOptions } from "pino";

const pinoConfiguration: LoggerOptions = {};

if (process.env.NODE_ENV === "development") {
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
