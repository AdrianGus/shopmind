import "dotenv/config";

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import express from "express";
import type { ErrorRequestHandler, RequestHandler } from "express";
import { agentRouter } from "./routes/agent.routes.js";
import { isServiceError } from "./utils/errors.js";

const app = express();
const port = Number.parseInt(process.env.PORT ?? "3000", 10);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.resolve(__dirname, "../client/dist");
const clientIndexHtml = path.join(clientDist, "index.html");
const hasClientBuild = fs.existsSync(clientIndexHtml);

app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "shopmind",
    environment: process.env.NODE_ENV ?? "development",
  });
});

app.use("/api/agent", agentRouter);

if (hasClientBuild) {
  app.use(
    express.static(clientDist, {
      index: false,
    }),
  );
}

const notFoundHandler: RequestHandler = (req, res, next) => {
  const wantsHtml =
    (req.method === "GET" || req.method === "HEAD") &&
    !req.path.startsWith("/api") &&
    req.path !== "/health" &&
    hasClientBuild;

  if (wantsHtml) {
    res.sendFile(clientIndexHtml, (err: Error | null) => {
      if (err) {
        next(err);
      }
    });
    return;
  }

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
  const message = isServiceError(err)
    ? err.message
    : process.env.NODE_ENV === "production"
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
  if (hasClientBuild) {
    console.log(`ShopMind UI available at http://localhost:${port}/`);
  }
});
