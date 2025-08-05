const logger = require('../utils/logger');
const config = require('../config/config');

class AppError extends Error {
  constructor(message, statusCode, code = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

const handleCastErrorDB = (error) => {
  const message = `Invalid ${error.path}: ${error.value}`;
  return new AppError(message, 400, 'INVALID_DATA');
};

const handleDuplicateFieldsDB = (error) => {
  const field = Object.keys(error.keyValue)[0];
  const value = error.keyValue[field];
  const message = `Duplicate field value: ${field} = '${value}'. Please use another value!`;
  return new AppError(message, 400, 'DUPLICATE_FIELD');
};

const handleValidationErrorDB = (error) => {
  const errors = Object.values(error.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400, 'VALIDATION_ERROR');
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401, 'INVALID_TOKEN');

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401, 'TOKEN_EXPIRED');

const handleSQLError = (error) => {
  // Handle SQL Server specific errors
  switch (error.number) {
    case 2: // Cannot open database
    case 18456: // Login failed
      return new AppError('Database connection failed', 500, 'DATABASE_ERROR');
    case 2627: // Violation of PRIMARY KEY constraint
    case 2601: // Violation of UNIQUE KEY constraint
      return new AppError('Duplicate entry detected', 400, 'DUPLICATE_ENTRY');
    case 515: // Cannot insert NULL
      return new AppError('Missing required field', 400, 'REQUIRED_FIELD');
    case 8152: // String or binary data would be truncated
      return new AppError('Data too long for field', 400, 'DATA_TOO_LONG');
    case 547: // Foreign key constraint
      return new AppError('Invalid reference to related data', 400, 'INVALID_REFERENCE');
    default:
      return new AppError('Database operation failed', 500, 'DATABASE_ERROR');
  }
};

const handleRedisError = (error) => {
  logger.logRedisOperation('error', 'connection', 0, error);
  return new AppError('Cache service temporarily unavailable', 503, 'CACHE_ERROR');
};

const sendErrorDev = (err, req, res) => {
  // Log the full error in development
  logger.logAPIError(err, req, { environment: 'development' });

  return res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
    code: err.code,
    details: err.details,
    requestId: req.id
  });
};

const sendErrorProd = (err, req, res) => {
  // Log error details for monitoring
  logger.logAPIError(err, req, { 
    environment: 'production',
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  // Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      code: err.code,
      requestId: req.id
    });
  }

  // Programming or other unknown error: don't leak error details
  logger.error('Unexpected error occurred', {
    error: err,
    requestId: req.id,
    userId: req.user?.id
  });

  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    code: 'INTERNAL_ERROR',
    requestId: req.id
  });
};

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (config.app.env === 'development') {
    return sendErrorDev(err, req, res);
  }

  // Production error handling
  let error = { ...err };
  error.message = err.message;

  // Handle specific error types
  if (error.name === 'CastError') error = handleCastErrorDB(error);
  if (error.code === 11000) error = handleDuplicateFieldsDB(error);
  if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
  if (error.name === 'JsonWebTokenError') error = handleJWTError();
  if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
  
  // Handle SQL Server errors
  if (error.number && error.class) error = handleSQLError(error);
  
  // Handle Redis errors
  if (error.code === 'ECONNREFUSED' && error.address) error = handleRedisError(error);

  sendErrorProd(error, req, res);
};

// Async error wrapper
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Validation error helper
const createValidationError = (field, message, value = null) => {
  return new AppError(message, 400, 'VALIDATION_ERROR', {
    field,
    value,
    type: 'validation'
  });
};

// Authorization error helper
const createAuthError = (message = 'Access denied', code = 'ACCESS_DENIED') => {
  return new AppError(message, 403, code);
};

// Authentication error helper
const createAuthenticationError = (message = 'Authentication required', code = 'AUTH_REQUIRED') => {
  return new AppError(message, 401, code);
};

// Not found error helper
const createNotFoundError = (resource = 'Resource', id = null) => {
  const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
  return new AppError(message, 404, 'NOT_FOUND', { resource, id });
};

// Rate limit error helper
const createRateLimitError = (limit, window) => {
  return new AppError(
    `Too many requests. Limit: ${limit} requests per ${window}`,
    429,
    'RATE_LIMIT_EXCEEDED',
    { limit, window }
  );
};

// Business logic error helper
const createBusinessError = (message, code = 'BUSINESS_RULE_VIOLATION') => {
  return new AppError(message, 400, code);
};

// External service error helper
const createExternalServiceError = (service, message = 'External service unavailable') => {
  return new AppError(message, 503, 'EXTERNAL_SERVICE_ERROR', { service });
};

module.exports = {
  AppError,
  errorHandler,
  catchAsync,
  createValidationError,
  createAuthError,
  createAuthenticationError,
  createNotFoundError,
  createRateLimitError,
  createBusinessError,
  createExternalServiceError
};