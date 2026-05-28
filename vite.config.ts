import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

// Production builds for GitHub Pages live under elimadent.github.io/gluepull-web/,
// so all asset URLs need to be prefixed with /gluepull-web/. Dev server stays
// at root (/) so HMR + local network access work as normal. Widget build
// (vite.widget.config.ts) is unaffected — it bundles assets inline.
//
// `mode` comes from Vite (defaults to 'production' for `vite build`,
// 'development' for `vite dev`). Using the callback form avoids touching
// `process.env`, which would otherwise require pulling in @types/node just
// to satisfy `tsc --noEmit` on this file.
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/gluepull-web/' : '/',
  plugins: [react(), tsconfigPaths()],
  server: {
    host: true, // bind 0.0.0.0 so phones on the LAN can reach it
    port: 5173,
    // Allow Cloudflare quick tunnel hostnames + the local LAN IPs through
    // Vite's Host-header check so the dev server is reachable via the
    // trycloudflare.com proxy without disabling the security check entirely.
    allowedHosts: ['.trycloudflare.com', '.local', '192.168.1.89', 'localhost'],
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globals: true,
  },
}));
