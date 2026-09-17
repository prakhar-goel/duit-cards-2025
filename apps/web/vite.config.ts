import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
const apiOrigin = `http://127.0.0.1:${process.env.DUIT_API_PORT || 48152}`;
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": apiOrigin,
      "/health": apiOrigin,
    },
  },
  build: { sourcemap: true },
});
