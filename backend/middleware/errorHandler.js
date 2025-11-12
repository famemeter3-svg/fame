// Error handling middleware for Express
export function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Database errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({
      success: false,
      error: 'Duplicate entry - this record already exists',
      code: 'DUPLICATE_ENTRY',
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW') {
    return res.status(400).json({
      success: false,
      error: 'Invalid reference - referenced record does not exist',
      code: 'INVALID_REFERENCE',
    });
  }

  if (err.code && err.code.startsWith('ER_')) {
    return res.status(500).json({
      success: false,
      error: 'Database error occurred',
      code: err.code,
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: err.message,
      code: 'VALIDATION_ERROR',
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
  });
}

// 404 Not Found middleware
export function notFound(req, res) {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.path}`,
    code: 'NOT_FOUND',
  });
}
