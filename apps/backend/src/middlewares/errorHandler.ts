/**
 * Express Error Handling Middleware
 */

import { Request, Response, NextFunction } from 'express';

export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public details?: Record<string, any>;

  constructor(code: string, message: string, details?: Record<string, any>);
  constructor(statusCode: number, code: string, message: string, details?: Record<string, any>);
  constructor(
    statusOrCode: number | string,
    codeOrMessage: string,
    messageOrDetails?: string | Record<string, any>,
    details?: Record<string, any>
  ) {
    if (typeof statusOrCode === 'number') {
      super((messageOrDetails as string) || '');
      this.statusCode = statusOrCode;
      this.code = codeOrMessage;
      this.details = details;
    } else {
      super(codeOrMessage);
      this.statusCode = 400;
      this.code = statusOrCode;
      this.details = messageOrDetails as Record<string, any> | undefined;
    }

    this.name = 'ApiError';
  }
}

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
};
