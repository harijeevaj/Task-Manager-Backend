import rateLimit from "express-rate-limit";
import { errorResponse } from "../utils/apiResponse.js";

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  handler: (req, res) => {
    return errorResponse(res, 429, "TOO_MANY_REQUESTS", "Too many login attempts. Please try again later.");
  }
});
