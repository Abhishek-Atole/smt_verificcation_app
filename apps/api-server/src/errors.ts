export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(statusCode: number, message: string, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON(): {
    error: string;
    message: string;
    statusCode: number;
    code: string;
  } {
    return {
      error: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, message, 'AUTH_ERROR');
    this.name = 'AuthError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, message, 'FORBIDDEN_ERROR');
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class InternalError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(500, message, 'INTERNAL_ERROR');
    this.name = 'InternalError';
  }
}
