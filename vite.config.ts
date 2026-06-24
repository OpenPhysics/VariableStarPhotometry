import type { Plugin, Rollup } from "vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

/**
 * Security headers required for:
 *  - COOP/COEP: SharedArrayBuffer support
 *  - CSP: restrict resource loading to same-origin + known blob/data exceptions
 *  - X-Content-Type-Options: prevent MIME sniffing
 *  - X-Frame-Options: prevent clickjacking (belt-and-suspenders alongside frame-ancestors)
 */
const securityHeaders: Record<string, string> = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Content-Security-Policy": [
    "default-src 'self'",
    // 'unsafe-eval' is required for SceneryStack query parameter parsing
    "script-src 'self' 'unsafe-eval'",
    "worker-src blob: 'self'",
    // Inline styles are set via element.style / cssText throughout the UI layer
    "style-src 'self' 'unsafe-inline'",
    // data: for icons
    "img-src 'self' data:",
    "media-src 'self' blob:",
    // blob: for fetch inside workers
    "connect-src 'self' blob:",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
  ].join("; "),
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

/** Escape a string for literal use inside a `RegExp`. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Decode a Rollup asset source (string or bytes) to text. */
function assetSourceToText(source: string | Uint8Array): string {
  return typeof source === "string" ? source : Buffer.from(source).toString("utf8");
}

/**
 * Return `html` with the tag that references `fileName` replaced by an inline
 * `<script>`/`<style>`, or `null` when this asset is not referenced.
 */
function inlineAsset(html: string, fileName: string, item: Rollup.OutputChunk | Rollup.OutputAsset): string | null {
  const ref = escapeRegExp(fileName);

  if (item.type === "chunk") {
    const scriptTag = new RegExp(`<script[^>]*\\bsrc="[^"]*${ref}"[^>]*></script>`);
    if (!scriptTag.test(html)) {
      return null;
    }
    const code = item.code.replace(/<\/script>/g, "<\\/script>");
    return html.replace(scriptTag, () => `<script type="module">${code}</script>`);
  }

  if (fileName.endsWith(".css")) {
    const linkTag = new RegExp(`<link[^>]*\\bhref="[^"]*${ref}"[^>]*>`);
    if (!linkTag.test(html)) {
      return null;
    }
    const css = assetSourceToText(item.source);
    return html.replace(linkTag, () => `<style>${css}</style>`);
  }

  return null;
}

/**
 * Dependency-free single-file plugin. Splices every JS chunk and CSS asset that
 * `index.html` references directly into the HTML as inline tags.
 */
function inlineSingleFile(): Plugin {
  return {
    name: "inline-single-file",
    enforce: "post",
    generateBundle(_options: Rollup.NormalizedOutputOptions, bundle: Rollup.OutputBundle): void {
      for (const htmlName of Object.keys(bundle)) {
        const htmlAsset = bundle[htmlName];
        if (!htmlName.endsWith(".html") || htmlAsset?.type !== "asset" || typeof htmlAsset.source !== "string") {
          continue;
        }

        let html = htmlAsset.source;
        for (const fileName of Object.keys(bundle)) {
          const item = bundle[fileName];
          if (!item) {
            continue;
          }
          const inlined = inlineAsset(html, fileName, item);
          if (inlined !== null) {
            html = inlined;
            delete bundle[fileName];
          }
        }

        htmlAsset.source = html.replace(/\s*<link[^>]*\brel="(?:icon|apple-touch-icon)"[^>]*>/g, "");
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const single = mode === "single";

  return {
    base: "./",
    build: {
      target: "es2024",
      ...(single && {
        assetsInlineLimit: 100_000_000,
        cssCodeSplit: false,
        copyPublicDir: false,
        rollupOptions: {
          output: { inlineDynamicImports: true },
        },
      }),
    },
    server: {
      headers: securityHeaders,
    },
    preview: {
      headers: securityHeaders,
    },
    plugins: single
      ? [inlineSingleFile()]
      : [
          VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["favicon.ico", "icons/apple-touch-icon.png"],
            manifest: {
              name: "Variable Star Photometry",
              // biome-ignore lint/style/useNamingConvention: Web App Manifest spec requires snake_case keys
              short_name: "VarStarPhoto",
              description: "A SceneryStack port of the NAAP Variable Star Photometry Lab",
              // biome-ignore lint/style/useNamingConvention: Web App Manifest spec requires snake_case keys
              theme_color: "#0a0a1a",
              // biome-ignore lint/style/useNamingConvention: Web App Manifest spec requires snake_case keys
              background_color: "#000000",
              display: "standalone",
              orientation: "landscape",
              icons: [
                {
                  src: "icons/icon-192.png",
                  sizes: "192x192",
                  type: "image/png",
                },
                {
                  src: "icons/icon-512.png",
                  sizes: "512x512",
                  type: "image/png",
                },
                {
                  src: "icons/icon.svg",
                  sizes: "any",
                  type: "image/svg+xml",
                  purpose: "maskable",
                },
              ],
            },
            workbox: {
              maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
              globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
            },
          }),
        ],
  };
});
