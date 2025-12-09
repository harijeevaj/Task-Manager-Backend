import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import taskRoutes from "./routes/task.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

import { requestLogger } from "./middleware/logger.js";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);



app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});


app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/categories", categoryRoutes);


app.use(errorHandler);

export default app;
