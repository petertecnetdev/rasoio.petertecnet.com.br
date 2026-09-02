import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  publicDir: "public",
  define: {
    "process.env.REACT_APP_API_URL": JSON.stringify(process.env.REACT_APP_API_URL || ""),
    "process.env.REACT_APP_GOOGLE_CLIENT_ID": JSON.stringify(
      process.env.REACT_APP_GOOGLE_CLIENT_ID || ""
    ),
  },
  build: {
    outDir: "build",
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    host: "0.0.0.0",
  },
  preview: {
    host: "0.0.0.0",
  },
});
