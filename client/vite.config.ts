import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const clientDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(clientDir, "..");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, repoRoot, "");
  const apiPort = env.PORT ?? process.env.PORT ?? "3000";

  return {
    root: clientDir,
    plugins: [react()],
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
    server: {
      port: Number.parseInt(env.VITE_DEV_PORT ?? "5173", 10),
      proxy: {
        "/api": {
          target: `http://127.0.0.1:${apiPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});
