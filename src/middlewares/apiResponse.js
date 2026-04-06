/**
 * Standardized API response handler
 * 
 * @param res - Express Response object
 * @param statusCode - HTTP status code
 * @param message - Human-readable result message
 * @param data - Optional payload data
 * @param pagination - Optional pagination metadata
 */

const apiResponse = (
  res,
  statusCode,
  message,
  data,
)=> {
  // Base response structure
  const response = {
    success: statusCode >= 200 && statusCode < 300,
    statusCode,
    message,
    // timestamp: new Date().toISOString(),
  };

  // Add data if provided
  if (data !== undefined) {
    response.data = data;
  }

  // Log successful responses (adjust level as needed)
  if (statusCode >= 200 && statusCode < 300) {
    console.info(`[${statusCode}] ${message}`);
  }

  return res.status(statusCode).json(response);
};

module.exports =  apiResponse ;
