import { errorResponse } from "../utils/apiResponse.js";

export const errorHandler = (err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  return errorResponse(res, err.statusCode || 500, err.code || "INTERNAL_ERROR", err.message || "Internal Server Error");
};
