/**
 * Authentication middleware for bot API endpoints
 * Validates API key for dashboard requests
 */

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const expectedSecret = process.env.AUTH_BOT_SECRET;

    // Skip auth for public endpoints (codes)
    if (req.path.startsWith('/api/codes/')) {
        return next();
    }

    // Check if auth header is present
    if (!authHeader) {
        return res.status(401).json({ 
            error: 'Unauthorized', 
            message: 'Authorization header is required' 
        });
    }

    // Check if secret is configured
    if (!expectedSecret) {
        console.error('AUTH_BOT_SECRET environment variable is not set');
        return res.status(500).json({ 
            error: 'Internal Server Error', 
            message: 'Authentication not configured' 
        });
    }

    // Validate Bearer token format
    if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            error: 'Unauthorized', 
            message: 'Invalid authorization format. Use Bearer token' 
        });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Validate the token
    if (token !== expectedSecret) {
        return res.status(401).json({ 
            error: 'Unauthorized', 
            message: 'Invalid API key' 
        });
    }

    // Authentication successful
    next();
};

module.exports = authMiddleware;
