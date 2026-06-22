import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "AGENTFLOW_");
  return {
    plugins: [react()],
    root: "frontend",
    base: "/",
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
    server: {
      port: 5173,
      host: "127.0.0.1",
      proxy: {
        "/api": {
          target: `http://${env.AGENTFLOW_HOST || "localhost"}:${env.AGENTFLOW_PORT || "18080"}`,
          changeOrigin: true,
        },
      },
    },
  };
});
