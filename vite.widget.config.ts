import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

/*
 * Separate build for the embeddable Shopify widget.
 *
 * Output: a single self-executing JS file (`dist-widget/gluepull-widget.iife.js`)
 * with React, the app, and ALL CSS bundled inside — no external imports, no
 * <link rel="stylesheet">, no code-splitting. Drop the file on any host (Shopify
 * Files, S3, GitHub Pages, your own CDN) and paste a one-line <script> tag
 * into a Custom Liquid block.
 */
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  build: {
    outDir: 'dist-widget',
    emptyOutDir: true,
    cssCodeSplit: false,
    minify: 'terser',
    sourcemap: false,
    target: 'es2018',
    lib: {
      entry: 'src/widget/entry.tsx',
      name: 'GluePull',
      formats: ['iife'],
      fileName: () => 'gluepull-widget.iife.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        // The widget brings its own React — do NOT externalize.
      },
    },
  },
});
