/**
 * Comprehensive error handling utility for the VibeList application
 */

// Error types for categorization
export const ErrorTypes = {
  AUTHENTICATION: "AUTHENTICATION",
  AUTHORIZATION: "AUTHORIZATION",
  VALIDATION: "VALIDATION",
  NOT_FOUND: "NOT_FOUND",
  SUBSCRIPTION: "SUBSCRIPTION",
  PAYMENT: "PAYMENT",
  DATABASE: "DATABASE",
  EXTERNAL_API: "EXTERNAL_API",
  RATE_LIMIT: "RATE_LIMIT",
  INTERNAL: "INTERNAL",
};

// Error severity levels
export const ErrorSeverity = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
};

/**
 * Custom error class with additional context
 */
export class AppError extends Error {
  constructor(
    message,
    type = ErrorTypes.INTERNAL,
    statusCode = 500,
    severity = ErrorSeverity.MEDIUM,
    context = {}
  ) {
    super(message);
    this.name = "AppError";
    this.type = type;
    this.statusCode = statusCode;
    this.severity = severity;
    this.context = context;
    this.timestamp = new Date().toISOString();

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Predefined error creators for common scenarios
 */
export const ErrorCreators = {
  // Authentication errors
  unauthorized: (message = "Authentication required") =>
    new AppError(message, ErrorTypes.AUTHENTICATION, 401, ErrorSeverity.MEDIUM),

  invalidCredentials: (message = "Invalid credentials") =>
    new AppError(message, ErrorTypes.AUTHENTICATION, 401, ErrorSeverity.MEDIUM),

  // Authorization errors
  forbidden: (message = "Access denied") =>
    new AppError(message, ErrorTypes.AUTHORIZATION, 403, ErrorSeverity.MEDIUM),

  subscriptionRequired: (feature = "this feature") =>
    new AppError(
      `Premium subscription required to access ${feature}`,
      ErrorTypes.SUBSCRIPTION,
      403,
      ErrorSeverity.LOW
    ),

  // Validation errors
  validationError: (message, field = null) =>
    new AppError(message, ErrorTypes.VALIDATION, 400, ErrorSeverity.LOW, {
      field,
    }),

  missingField: (field) =>
    new AppError(
      `${field} is required`,
      ErrorTypes.VALIDATION,
      400,
      ErrorSeverity.LOW,
      { field }
    ),

  // Not found errors
  notFound: (resource = "Resource") =>
    new AppError(
      `${resource} not found`,
      ErrorTypes.NOT_FOUND,
      404,
      ErrorSeverity.LOW
    ),

  // Payment errors
  paymentFailed: (message = "Payment processing failed") =>
    new AppError(message, ErrorTypes.PAYMENT, 402, ErrorSeverity.HIGH),

  // Database errors
  databaseError: (
    message = "Database operation failed",
    originalError = null
  ) =>
    new AppError(message, ErrorTypes.DATABASE, 500, ErrorSeverity.HIGH, {
      originalError,
    }),

  // External API errors
  externalApiError: (service, message = "External service unavailable") =>
    new AppError(message, ErrorTypes.EXTERNAL_API, 503, ErrorSeverity.MEDIUM, {
      service,
    }),

  // Rate limiting
  rateLimitExceeded: (message = "Rate limit exceeded") =>
    new AppError(message, ErrorTypes.RATE_LIMIT, 429, ErrorSeverity.LOW),

  // Internal errors
  internalError: (message = "Internal server error", originalError = null) =>
    new AppError(message, ErrorTypes.INTERNAL, 500, ErrorSeverity.CRITICAL, {
      originalError,
    }),
};

/**
 * Error logger with different levels
 */
export const ErrorLogger = {
  log: (error, context = {}) => {
    const logData = {
      timestamp: new Date().toISOString(),
      message: error.message,
      type: error.type || "UNKNOWN",
      severity: error.severity || ErrorSeverity.MEDIUM,
      statusCode: error.statusCode || 500,
      stack: error.stack,
      context: { ...error.context, ...context },
    };

    // Log based on severity
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        console.error("🚨 CRITICAL ERROR:", logData);
        break;
      case ErrorSeverity.HIGH:
        console.error("❌ HIGH SEVERITY ERROR:", logData);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn("⚠️ MEDIUM SEVERITY ERROR:", logData);
        break;
      case ErrorSeverity.LOW:
        console.info("ℹ️ LOW SEVERITY ERROR:", logData);
        break;
      default:
        console.error("ERROR:", logData);
    }

    // In production, you might want to send critical errors to an external service
    if (
      process.env.NODE_ENV === "production" &&
      error.severity === ErrorSeverity.CRITICAL
    ) {
      // TODO: Send to error tracking service (e.g., Sentry, LogRocket)
    }
  },
};

/**
 * Error response formatter for API routes
 */
export const formatErrorResponse = (error, includeStack = false) => {
  const isAppError = error instanceof AppError;

  const response = {
    error: {
      message: isAppError ? error.message : "An unexpected error occurred",
      type: isAppError ? error.type : ErrorTypes.INTERNAL,
      timestamp: new Date().toISOString(),
    },
  };

  // Include additional context for development
  if (process.env.NODE_ENV === "development" || includeStack) {
    response.error.stack = error.stack;
    if (isAppError && error.context) {
      response.error.context = error.context;
    }
  }

  return response;
};

/**
 * Error handler middleware for API routes
 */
export const handleApiError = (error, context = {}) => {
  // Log the error
  ErrorLogger.log(error, context);

  // Determine status code
  const statusCode = error instanceof AppError ? error.statusCode : 500;

  // Format response
  const response = formatErrorResponse(error);

  return { response, statusCode };
};

/**
 * Async error wrapper for API routes
 */
export const asyncErrorHandler = (handler) => {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      const { response, statusCode } = handleApiError(error, {
        url: request.url,
        method: request.method,
      });

      return new Response(JSON.stringify(response), {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }
  };
};

/**
 * Client-side error handler
 */
export const handleClientError = (error, context = {}) => {
  ErrorLogger.log(error, { ...context, clientSide: true });

  // Return user-friendly message
  if (error instanceof AppError) {
    return {
      message: error.message,
      type: error.type,
      severity: error.severity,
    };
  }

  return {
    message: "An unexpected error occurred. Please try again.",
    type: ErrorTypes.INTERNAL,
    severity: ErrorSeverity.MEDIUM,
  };
};

/**
 * Supabase error handler
 */
export const handleSupabaseError = (
  error,
  operation = "database operation"
) => {
  if (!error) return null;

  // Map common Supabase errors
  if (error.code === "PGRST116") {
    return ErrorCreators.notFound();
  }

  if (error.code === "23505") {
    return ErrorCreators.validationError("This record already exists");
  }

  if (error.code === "23503") {
    return ErrorCreators.validationError("Referenced record does not exist");
  }

  if (error.code === "42501") {
    return ErrorCreators.forbidden("Insufficient permissions");
  }

  // Generic database error
  return ErrorCreators.databaseError(`Failed to ${operation}`, error);
};

/**
 * Stripe error handler
 */
export const handleStripeError = (error) => {
  if (!error) return null;

  switch (error.type) {
    case "StripeCardError":
      return ErrorCreators.paymentFailed(error.message);
    case "StripeRateLimitError":
      return ErrorCreators.rateLimitExceeded(
        "Too many requests to payment processor"
      );
    case "StripeInvalidRequestError":
      return ErrorCreators.validationError(error.message);
    case "StripeAPIError":
      return ErrorCreators.externalApiError(
        "Stripe",
        "Payment service temporarily unavailable"
      );
    case "StripeConnectionError":
      return ErrorCreators.externalApiError(
        "Stripe",
        "Unable to connect to payment service"
      );
    case "StripeAuthenticationError":
      return ErrorCreators.internalError(
        "Payment service authentication failed"
      );
    default:
      return ErrorCreators.paymentFailed("Payment processing failed");
  }
};

export default {
  AppError,
  ErrorTypes,
  ErrorSeverity,
  ErrorCreators,
  ErrorLogger,
  formatErrorResponse,
  handleApiError,
  asyncErrorHandler,
  handleClientError,
  handleSupabaseError,
  handleStripeError,
};
