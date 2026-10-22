import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";

// The repo keeps one shared .env.example / .env.test at the root (see the
// Readme's "Environment variables" section), so Vite reads env files from
// there instead of from apps/web.
const envDir = fileURLToPath(new URL("../..", import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  // svgr() lets `import Icon from "./icon.svg?react"` yield a React
  // component instead of a URL string - see
  // src/assets/icons/__tests__/example.test.tsx for a working example.
  plugins: [react(), tailwindcss(), tsconfigPaths(), svgr()],
  envDir,
  server: {
    watch: {
      usePolling: true,
    },
    host: true,
    strictPort: true,
    // Playwright (in the docker-compose-e2e.yml "playwright" container)
    // hits this server over the docker network as "http://web:5173", so
    // Vite's Host-header check needs to allow that hostname explicitly.
    allowedHosts: ["web"],
  },
});
