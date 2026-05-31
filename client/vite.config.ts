import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@features": path.resolve(__dirname, "./src/features"),
      "@shared": path.resolve(__dirname, "./src/shared"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@store": path.resolve(__dirname, "./src/shared/store"),
      "@lib": path.resolve(__dirname, "./src/shared/lib"),
      "@hooks": path.resolve(__dirname, "./src/shared/hooks"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy all /api requests to the backend in development.
      // This makes requests same-origin from the browser's perspective,
      // eliminating cross-origin cookie issues (SameSite, CORS) entirely.
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
