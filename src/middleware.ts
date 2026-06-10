/**
 * src/middleware.ts
 *
 * Runs on EVERY SSR request (when an adapter is added — Node, Cloudflare,
 * Vercel). Has no effect on statically prerendered pages.
 *
 * For static-only deployment, this middleware is dormant — security headers
 * are delivered by public/_headers (Cloudflare Pages / Netlify) instead.
 * Both mechanisms must be kept in sync.
 */

import { defineMiddleware } from 'astro:middleware';

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// No external connections — all resources served from same origin only.
function buildCSP(nonce: string): string {
  const directives = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self'`,
    `font-src 'self'`,
    `img-src 'self' data:`,
    `connect-src 'self'`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    `upgrade-insecure-requests`,
  ];
  return directives.join('; ');
}

function applySecurityHeaders(headers: Headers, nonce: string): void {
  headers.set('Content-Security-Policy', buildCSP(nonce));
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=()'
  );
  headers.delete('X-Powered-By');
  headers.delete('Server');
}

export const onRequest = defineMiddleware(async (context, next) => {
  const nonce = generateNonce();
  context.locals.nonce = nonce;

  const response = await next();

  // Skip in dev — strict-dynamic CSP blocks Vite HMR and unbundled module scripts
  if (import.meta.env.DEV) {
    return response;
  }

  const newHeaders = new Headers(response.headers);
  applySecurityHeaders(newHeaders, nonce);

  return new Response(response.body, {
    status:     response.status,
    statusText: response.statusText,
    headers:    newHeaders,
  });
});
