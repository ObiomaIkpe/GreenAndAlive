import { config } from '../config/environment';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ErrorHandler {
  private static instance: ErrorHandler;

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  public handleError(error: Error | AppError): void {
    console.error('Application Error:', error);

    // Log to external service in production
    if (config.isProduction && config.sentry.dsn) {
      this.logToSentry(error);
    }

    // Show user-friendly message
    this.showUserNotification(error);
  }

  private logToSentry(error: Error): void {
    // In a real app, integrate with Sentry
    console.log('Would log to Sentry:', error.message);
  }

  private showUserNotification(error: Error): void {
    const message = error instanceof AppError 
      ? error.message 
      : 'An unexpected error occurred. Please try again.';
    
    // In a real app, integrate with toast notification system
    console.warn('User notification:', message);
  }
}

export const errorHandler = ErrorHandler.getInstance();