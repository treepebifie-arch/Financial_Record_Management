const { ZodError } = require("zod");
const ApiError = require("../apiError");

/**
 * Validates request data across body, params, and query automatically
 */
function validateData(schema) {
  return async (req, res, next) => {
    try {
      // 1. Combine all data sources into one object for validation
      const dataToValidate = {
        ...req.body,
        ...req.params,
        ...req.query,
      };

      // 2. Validate the combined object
      const validatedData = await schema.parseAsync(dataToValidate);

      // 3. (Optional) Re-assign validated data back to help with type-casting (like strings to numbers)
      // Note: If fields overlap, you might want to be specific, but for 
      // simple record management, this works perfectly.
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorDetails = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.code === 'invalid_type' && !err.received ? "required" : err.message,
        }));

        return next(new ApiError(400, `${errorDetails[0].field}: ${errorDetails[0].message}`, errorDetails));
      }
      return next(error);
    }
  };
}

module.exports = validateData;