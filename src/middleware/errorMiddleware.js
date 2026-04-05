const { ZodError } = require('zod');

const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message
      }))
    });
  }

  if (process.env.NODE_ENV === 'development') {
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Internal server error',
      code: err.code || 'INTERNAL_ERROR'
    });
  }

  return res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 ? 'Internal server error' : err.message,
    code: err.code || 'INTERNAL_ERROR'
  });
};

module.exports = errorMiddleware;
