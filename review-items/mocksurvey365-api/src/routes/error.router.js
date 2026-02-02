const errorHandler = (error, request, response, next) => {
    const statusCode = error.statusCode || 500;
    const message =
      error.message ||
      "We are unable to process your request now and this is entirely our fault.";
    const slug = error.slug || "";
    const devError = error.devError || "";
  
    const errorResponse = {
      success: false,
      message,
      slug,
      devError,
    };
  
    response.status(statusCode).json(errorResponse);
  };
  
  module.exports = {
    errorHandler,
  };
  