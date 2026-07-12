import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { connectDB } from './config/db';
import apiRouter from './routes/api';
import { notFoundMiddleware } from './middlewares/notFoundMiddleware';
import { errorMiddleware } from './middlewares/errorMiddleware';
import { swaggerSpec } from './config/swagger';
import { rateLimiter, securityHeaders } from './middlewares/securityMiddleware';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Security middlewares
app.use(securityHeaders);
app.use('/api/', rateLimiter);

// Swagger Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple console request logger for development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// Mount API routes
app.use('/api/v1', apiRouter);

// Fallback middlewares for routes not found and errors
app.use(notFoundMiddleware);
app.use(errorMiddleware);

// Start server
app.listen(PORT, () => {
  console.log(`TransitOps server listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
});

export default app;

// Hot-reloaded: MongoDB started successfully. Clean env configured.
