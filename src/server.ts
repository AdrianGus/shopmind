import "dotenv/config";

import express from "express";
import type { ErrorRequestHandler, RequestHandler } from "express";

const app = express();
const port = Number.parseInt(process.env.PORT ?? "3000", 10);

app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "shopmind",
    environment: process.env.NODE_ENV ?? "development",
  });
});

const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
};

const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode =
    err instanceof Error && "statusCode" in err && typeof err.statusCode === "number"
      ? err.statusCode
      : 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err instanceof Error
        ? err.message
        : "Unknown error";

  return res.status(statusCode).json({
    status: "error",
    message,
  });
};

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`ShopMind API listening on http://localhost:${port}`);
});
