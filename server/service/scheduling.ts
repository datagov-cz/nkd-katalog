import logger from "../logger.ts";

/**
 * Register a given callback to be invoked in the given interval.
 * A failure of the callback, synchronous or asynchronous, is logged
 * and does not stop the schedule.
 * @returns A function that cancels the schedule.
 */
export function schedule(
  interval: { minutes: number },
  callback: () => void | Promise<void>,
): () => void {
  const intervalMs = interval.minutes * 60 * 1000;
  const onError = (exception: unknown) =>
    logger.error(exception, "Scheduled callback failed.");
  const timer = setInterval(() => {
    try {
      Promise.resolve(callback()).catch(onError);
    } catch (exception) {
      onError(exception);
    }
  }, intervalMs);
  return () => clearInterval(timer);
}
