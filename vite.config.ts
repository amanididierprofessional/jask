// Lovable TanStack Start config.
// We disable the Cloudflare adapter and force the Vercel Nitro preset
// so GitHub → Vercel deploys work correctly.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Critical: stop Lovable from forcing Cloudflare Workers output
  cloudflare: false,

  tanstackStart: {
    // Keep the custom server entry (SSR error wrapper)
    server: { entry: "server" },
  },

  // Force Nitro to emit Vercel Functions
  nitro: {
    preset: "vercel",
  },
});
