import { Request, Response, NextFunction } from 'express';

// In-memory bucket store for IP-based rate limiting
interface RateLimitBucket {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitBucket>();

// Configuration parameters
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
const MAX_REQUESTS = 300; // max 300 requests per window per IP

/**
 * Custom Rate Limiting Middleware
 */
export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  let bucket = rateLimitStore.get(ip);

  // If bucket doesn't exist or is expired, create/reset it
  if (!bucket || now > bucket.resetTime) {
    bucket = {
      count: 0,
      resetTime: now + WINDOW_MS,
    };
    rateLimitStore.set(ip, bucket);
  }

  bucket.count++;

  // Set standard headers
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - bucket.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil(bucket.resetTime / 1000));

  if (bucket.count > MAX_REQUESTS) {
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again after 15 minutes.',
    });
    return;
  }

  next();
};

/**
 * Custom HTTP Security Headers Middleware (Helmet-like protections)
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Prevent clickjacking / rendering in frame/iframe
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent browser MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable browser XSS protection block
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Strict Transport Security (HSTS) for SSL connections
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');

  // Content Security Policy (CSP) - allow self assets, images, and fonts securely
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: http:; connect-src 'self' http://localhost:5000 http://localhost:5173 http://localhost:27017;"
  );

  next();
};
