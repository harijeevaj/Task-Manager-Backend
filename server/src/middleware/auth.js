import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { User } from "../models/index.js";
import { errorResponse } from "../utils/apiResponse.js";

dotenv.config();

export const authRequired = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return errorResponse(res, 401, "UNAUTHORIZED", "Missing authorization token");
  }

  const token = header.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findByPk(payload.sub);

    if (!user) {
      return errorResponse(res, 401, "UNAUTHORIZED", "User not found");
    }

    req.user = user;
    next();
  } catch (err) {
    return errorResponse(res, 401, "UNAUTHORIZED", "Invalid or expired token");
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return errorResponse(res, 403, "FORBIDDEN", "Admin access only");
  }
  next();
};
