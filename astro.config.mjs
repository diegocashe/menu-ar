// @ts-check
import { defineConfig } from 'astro/config';

/**
 * SECURITY ARCHITECTURE — astro.config.mjs
 *
 * CSP is NOT delivered via Astro's `security.csp` (injects <meta> tag, weaker
 * than HTTP headers). Instead:
 *   Static deployment → public/_headers  (Cloudflare Pages / Netlify)
 *   SSR deployment    → src/middleware.ts (sets Content-Security-Policy header)
 *
 * CHECKORIGIN:
 *   Validates Origin === Host on mutating requests. CSRF protection for SSR
 *   routes / form actions. Defaults to true in Astro v6; made explicit here.
 */
export default defineConfig({
  site: 'https://www.ar-menu.diegocashe.dev',

  security: {
    checkOrigin: true,
  },

  image: {
    // No external image sources — prevents SSRF through the image optimiser.
    domains: [],
    remotePatterns: [],
  },
});
