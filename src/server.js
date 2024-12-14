import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { main } from './index.js';

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400 // 24 hours
};
app.use(cors(corsOptions));

// Body parser middleware with size limit
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        status: 429,
        error: 'Too many requests, please try again later.',
        details: 'Rate limit exceeded'
    }
});
app.use(limiter);

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// URL validation middleware
const validateUrls = (req, res, next) => {
    const { urls } = req.body;

    // Check if urls is present and is an array
    if (!urls || !Array.isArray(urls)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid request format',
            details: 'Please provide an array of URLs'
        });
    }

    // Check array length
    if (urls.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Empty URL array',
            details: 'Please provide at least one URL'
        });
    }

    if (urls.length > 10) {
        return res.status(400).json({
            success: false,
            error: 'Too many URLs',
            details: 'Maximum 10 URLs allowed per request'
        });
    }

    // Validate each URL format
    const invalidUrls = urls.filter(url => {
        try {
            new URL(url);
            return false;
        } catch {
            return true;
        }
    });

    if (invalidUrls.length > 0) {
        return res.status(400).json({
            success: false,
            error: 'Invalid URLs detected',
            details: `The following URLs are invalid: ${invalidUrls.join(', ')}`
        });
    }

    next();
};

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Main scraping endpoint
app.post('/scrape', validateUrls, async (req, res) => {
    try {
        const { urls } = req.body;
        console.log('Processing URLs:', urls);

        const results = await main(urls);

        // Validate results
        if (!results || !Array.isArray(results)) {
            throw new Error('Invalid results format from scraper');
        }

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            count: results.length,
            results
        });
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'The requested endpoint does not exist'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}); 