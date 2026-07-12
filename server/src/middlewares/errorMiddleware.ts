import { Request, Response, NextFunction } from 'express';

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || res.statusCode === 200 ? 500 : res.statusCode;
  const message = err.message || 'Internal Server Error';

  console.error(`[Error Middleware] [${req.method}] ${req.url} - Status ${statusCode} - ${message}`);
  if (err.stack && process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
