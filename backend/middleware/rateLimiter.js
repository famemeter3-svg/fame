import rateLimit from 'express-rate-limit';
import { config } from '../config/environment.js';

// Rate limiting for general API endpoints
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,  // 15 minutes
  max: config.rateLimit.max,  // 100 requests per window
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,  // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,  // Disable X-RateLimit-* headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
});

// Stricter rate limiting for scraping endpoints
export const scrapeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 5,  // 5 scrape requests per hour
  message: 'Too many scraping requests, please wait before triggering another scrape',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for login/auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,  // 5 attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
