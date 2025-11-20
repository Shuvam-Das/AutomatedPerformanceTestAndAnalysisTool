const pino = require('pino');

/**
 * Creates a structured JSON logger.
 * @param {string} serviceName - The name of the agent/service.
 * @param {string} correlationId - The unique ID for the current execution.
 * @returns A logger instance.
 */
function createLogger(serviceName, correlationId) {
  return pino({
    level: process.env.LOG_LEVEL || 'info',
    base: { service: serviceName, correlationId },
  });
}

module.exports = { createLogger };