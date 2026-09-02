import { defineConfig, transformWithOxc } from "vite";
import react from "@vitejs/plugin-react";

const legacyJsxInJs = () => ({
  name: "rasoio-legacy-jsx-in-js",
  enforce: "pre",
  async transform(code, id) {
    if (!/\/src\/.*\.js$/.test(id)) return null;

    const result = await transformWithOxc(code, id, {
      lang: "jsx",
      jsx: {
        runtime: "automatic",
        development: false,
      },
    });

    return {
      code: result.code,
      map: result.map || null,
    };
  },
});

export default defineConfig({
  plugins: [
    legacyJsxInJs(),
    react({ include: /\.[jt]sx?$/ }),
  ],
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
