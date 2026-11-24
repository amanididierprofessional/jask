import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";

export default defineConfig({
  // Disable Cloudflare adapter so Nitro can target Vercel correctly
  cloudflare: false,

  tanstackStart: {
    server: { entry: "server" },
  },

  // Explicitly force Vercel preset
  nitro: {
    preset: "vercel",
  },

  // Also inject the nitro plugin with vercel preset as a safety net
  vite: {
    plugins: [
      nitro({
        preset: "vercel",
      }),
    ],
  },
});
