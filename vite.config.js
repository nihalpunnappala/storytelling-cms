import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: process.env.PORT || 3000 || 3004,
    host: "0.0.0.0",
    cors: true,
    hmr: {
      host: process.env.NODE_ENV === "production" ? undefined : "start.local",
      port: process.env.PORT || 3000 || 3004,
    },
    watch: {
      usePolling: true,
    },
    allowedHosts: ["*"],
  },
  preview: {
    port: process.env.PORT || 3000 || 3004,
    host: "0.0.0.0",
    allowedHosts: ["event-hex-saad-vite-mzmxq.ondigitalocean.app","go-campus-cms-g6y6g.ondigitalocean.app"],
  },
  optimizeDeps: {
    exclude: ["js-big-decimal"],
  },
  build: {
    outDir: "build",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          // Add other large dependencies here
        },
      },
    },
  },
});