class ApiError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode || 500;
    this.code = code || 'INTERNAL_ERROR';
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

class ValidationError extends ApiError {
  constructor(code, message, details) {
    super(400, code || 'VALIDATION_ERROR', message, details);
  }
}

class ExternalServiceError extends ApiError {
  constructor(code, message, details) {
    super(502, code || 'EXTERNAL_SERVICE_ERROR', message, details);
  }
}

module.exports = {
  ApiError,
  ValidationError,
  ExternalServiceError,
};

