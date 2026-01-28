/**
 * Simple logger utility
 */
export function createLogger() {
  return {
    info: (msg, ...args) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`, ...args),
    warn: (msg, ...args) => console.warn(`[WARN] ${new Date().toISOString()} ${msg}`, ...args),
    error: (msg, ...args) => console.error(`[ERROR] ${new Date().toISOString()} ${msg}`, ...args),
    debug: (msg, ...args) => {
      if (process.env.DEBUG === 'true') {
        console.debug(`[DEBUG] ${new Date().toISOString()} ${msg}`, ...args);
      }
    }
  };
}
