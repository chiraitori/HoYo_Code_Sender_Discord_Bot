/**
 * Authentication middleware for bot API endpoints.
 * Supports HMAC-SHA256 signed requests (with timestamp + nonce replay guard)
 * and timing-safe Bearer token fallback in hybrid mode.
 */

const { createDashboardAuthMiddleware } = require('./dashboardBridge');

const authMiddleware = createDashboardAuthMiddleware();

module.exports = authMiddleware;
