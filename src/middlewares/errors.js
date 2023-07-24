// Custom error classes
class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "NotFoundError";
  }
}

class BadRequestError extends Error {
  constructor(message) {
    super(message);
    this.name = "BadRequestError";
  }
}

// Custom error classes
class FileUploadError extends Error {
  constructor(message) {
    super(message);
    this.name = "FileUploadError";
  }
}

class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = "AuthenticationError";
  }
}

// Error handling middleware
function errorHandler(err, req, res, next) {
  // Handle specific error types
  if (err instanceof NotFoundError) {
    return res.status(404).json({
      success: false,
      error: err.name,
      message: err.message,
    });
  }

  if (err instanceof BadRequestError) {
    return res.status(400).json({
      success: false,
      error: err.name,
      message: err.message,
    });
  }

  // Handle generic errors
  console.error(err); // Log the error for debugging purposes
  return res.status(500).json({
    success: false,
    error: "ServerError",
    message: "An unexpected error occurred",
  });
}

module.exports = {
  NotFoundError,
  BadRequestError,
  FileUploadError,
  errorHandler,
  AuthenticationError,
};
