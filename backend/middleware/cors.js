import cors from 'cors';
import { config } from '../config/environment.js';

// CORS configuration for frontend
export const corsOptions = {
  origin: config.frontend.url,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

// Export configured CORS middleware
export const corsMiddleware = cors(corsOptions);
