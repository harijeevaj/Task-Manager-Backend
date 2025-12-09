import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { User, RefreshToken } from "../models/index.js";
import {
  validateEmail,
  validatePassword
} from "../utils/validation.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

dotenv.config();

const generateTokens = async (userId) => {
  const accessToken = jwt.sign(
    { sub: userId },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: `${process.env.JWT_ACCESS_EXPIRES_IN || 3600}s` }
  );
console.log("Generated JWT Token:", accessToken);


  const refreshTokenValue = jwt.sign(
    { sub: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: `${process.env.JWT_REFRESH_EXPIRES_IN || 604800}s` }
  );

  const expiresAt = new Date(Date.now() + (process.env.JWT_REFRESH_EXPIRES_IN || 604800) * 1000);

  await RefreshToken.create({
    user_id: userId,
    token: refreshTokenValue,
    expiresAt
  });

  return {
    accessToken,
    refreshToken: refreshTokenValue,
    expiresIn: Number(process.env.JWT_ACCESS_EXPIRES_IN || 3600)
  };
};

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const details = [];

    if (!username || username.trim().length < 3) {
      details.push({ field: "username", message: "Username must be at least 3 characters" });
    }

    if (!validateEmail(email)) {
      details.push({ field: "email", message: "Invalid email format" });
    }

    if (!validatePassword(password)) {
      details.push({ field: "password", message: "Password must be at least 6 chars and contain a number" });
    }

    if (details.length) {
      return errorResponse(res, 400, "VALIDATION_ERROR", "Invalid input data", details);
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return errorResponse(res, 409, "CONFLICT", "Email already exists");
    }

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return errorResponse(res, 409, "CONFLICT", "Username already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      passwordHash
    });

    const tokens = await generateTokens(user.id);

    return successResponse(res, 201, "Registration successful", {
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      tokens
    });
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "INTERNAL_ERROR", "Registration failed");
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!validateEmail(email) || !password) {
      return errorResponse(res, 400, "VALIDATION_ERROR", "Invalid input data", [
        { field: "email", message: "Email is required" },
        { field: "password", message: "Password is required" }
      ]);
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return errorResponse(res, 401, "UNAUTHORIZED", "Invalid email or password");
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return errorResponse(res, 401, "UNAUTHORIZED", "Invalid email or password");
    }

    const tokens = await generateTokens(user.id);

    return successResponse(res, 200, "Login successful", { tokens });
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "INTERNAL_ERROR", "Login failed");
  }
};

export const me = async (req, res) => {
  const user = req.user;
  return successResponse(res, 200, "Current user", {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  });
};

export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await RefreshToken.update(
        { revoked: true },
        { where: { token: refreshToken } }
      );
    }
    return successResponse(res, 200, "Logged out successfully");
  } catch (err) {
    console.error(err);
    return errorResponse(res, 500, "INTERNAL_ERROR", "Logout failed");
  }
};
