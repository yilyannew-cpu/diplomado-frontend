// defineConfig ya incluye los plugins base de TanStack Start / Vite / Tailwind / Nitro.
// No agregues tanstackStart(), viteReact(), nitro(), etc. manualmente (duplicarlos rompe el build).
// Puedes pasar config extra con defineConfig({ vite: { ... }, ... }).
// Para Vercel: nitro.preset = "vercel" (ver docs/DEPLOY-VERCEL.md).
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

// Extraemos las variables del .env forzando la lectura en Node
const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');

const API_PROXY_TARGET =
  env.VITE_API_PROXY_TARGET ?? "https://ffcore-api.onrender.com";

export default defineConfig({
  vite: {
    server: {
      proxy: {
        "/api": {
          target: API_PROXY_TARGET,
          changeOrigin: true,
          secure: true,
        },
        "/socket.io": {
          target: API_PROXY_TARGET,
          changeOrigin: true,
          secure: true,
          ws: true,
        },
        "/uploads": {
          target: API_PROXY_TARGET,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  nitro: {
    preset: "vercel",
    vercel: {
      // Evita errores SSR con TanStack Start + handler web de Nitro.
      entryFormat: "node",
    },
  },
});
