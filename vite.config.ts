import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const isProduction = mode === "production";
  const isDevelopment = mode === "development";

  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
      open: false,
      hmr: {
        overlay: true,
      },
      fs: {
        strict: true,
      },
    },
    plugins: [react()],
    css: {
      postcss: "./postcss.config.js",
      devSourcemap: isDevelopment,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
            redux: ["react-redux", "@reduxjs/toolkit"],
            ui: ["react-window", "react-window-infinite-loader"],
            icons: ["lucide-react"],
            ai: ["@google/genai"],
            utils: ["zod"],
          },
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split(".");
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `assets/images/[name]-[hash][extname]`;
            }
            if (/css/i.test(ext)) {
              return `assets/css/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
          chunkFileNames: "assets/js/[name]-[hash].js",
          entryFileNames: "assets/js/[name]-[hash].js",
        },
        treeshake: {
          moduleSideEffects: false,
        },
      },
      cssCodeSplit: true,
      sourcemap: isDevelopment,
      minify: isProduction ? "esbuild" : false,
      target: "esnext",
      chunkSizeWarningLimit: 1000,
      assetsInlineLimit: 4096,
      reportCompressedSize: isProduction,
    },
    optimizeDeps: {
      include: ["react", "react-dom", "lucide-react", "@google/genai"],
      force: false,
    },
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      global: "window",
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
  };
});
