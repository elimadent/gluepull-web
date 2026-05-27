/*
 * Widget entry — self-mounting Shopify-friendly bootstrap.
 *
 * On load:
 *   1. Finds every <div data-gluepull-widget> on the page (or a custom selector
 *      passed via window.GluePullConfig.selector).
 *   2. Attaches an open shadow root to each host (Shopify themes can't style
 *      across the boundary, and our styles can't bleed out into the theme).
 *   3. Injects the inlined GluePull CSS as a single <style> inside the shadow.
 *   4. Mounts <App embedded /> inside the shadow.
 *
 * Build target: a single IIFE file (`gluepull-widget.iife.js`) with CSS inlined
 * via Vite's ?inline import suffix. No runtime imports, no <link> tags needed.
 */

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import css from '@/styles.css?inline';
import { App } from '@/App';

declare global {
  interface Window {
    GluePullConfig?: { selector?: string };
    GluePull?: {
      mount: (target: Element | string) => void;
      version: string;
    };
  }
}

const VERSION = '1.0.0';
const DEFAULT_SELECTOR = '[data-gluepull-widget]';

const mounted = new WeakMap<Element, Root>();

function mountInto(host: Element): void {
  if (mounted.has(host)) return;

  // Ensure host is a block-level container so the shadow fills it sensibly.
  if (host instanceof HTMLElement) {
    if (!host.style.display) host.style.display = 'block';
    if (!host.style.width) host.style.width = '100%';
  }

  let shadow: ShadowRoot;
  try {
    shadow = host.attachShadow({ mode: 'open' });
  } catch {
    // Already attached (re-mount). Bail safely.
    return;
  }

  const style = document.createElement('style');
  style.textContent = css;
  shadow.appendChild(style);

  const mountPoint = document.createElement('div');
  shadow.appendChild(mountPoint);

  const root = createRoot(mountPoint);
  root.render(
    <React.StrictMode>
      <App embedded />
    </React.StrictMode>
  );
  mounted.set(host, root);
}

function mountAll(selector: string): void {
  const hosts = document.querySelectorAll(selector);
  hosts.forEach(mountInto);
}

function start(): void {
  const selector = window.GluePullConfig?.selector ?? DEFAULT_SELECTOR;
  mountAll(selector);
}

window.GluePull = {
  version: VERSION,
  mount(target) {
    if (typeof target === 'string') mountAll(target);
    else mountInto(target);
  },
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
