import type { Configuration } from "../configuration.ts";

export interface HeadData {
  matomoIsActive: boolean;
  matomoUrl: string | null;
  matomoSiteId: string | null;
  designSystem: string;
}

export function createHeadData({ client }: Configuration): HeadData {
  return {
    matomoIsActive:
      client.matomoUrl !== null && client.matomoSiteId !== null,
    matomoUrl: client.matomoUrl,
    matomoSiteId: client.matomoSiteId,
    designSystem: client.govDesignSystem,
  };
}

const FAVICON_APPLE_SIZES = [
  "57x57",
  "60x60",
  "72x72",
  "76x76",
  "114x114",
  "120x120",
  "144x144",
  "152x152",
  "180x180",
];

const FAVICON_ICON = [
  { sizes: "192x192", href: "android-icon-192x192.png" },
  { sizes: "32x32", href: "favicon-32x32.png" },
  { sizes: "96x96", href: "favicon-96x96.png" },
  { sizes: "16x16", href: "favicon-16x16.png" },
];

/**
 * The design-system config is emitted as executable JavaScript, so it cannot
 * go through JSX text escaping. The indentation here mirrors what the
 * `{{> head }}` Handlebars include produced (its two-space body plus the
 * two-space include indent); a Commit B re-capture will re-flow it.
 */
const GOV_DS_CONFIG_SCRIPT =
  '\n    window.GOV_DS_CONFIG = {\n' +
  '      "canValidateWcagOnRender": true,\n' +
  '      "iconsPath": "../../icons",\n' +
  "    };\n  ";

/** JSX port of `head.html`. `<head>`-level tags only, no wrapping element. */
export function Head({ state }: { state: HeadData }) {
  const ds = state.designSystem;
  return (
    <>
      <meta charset="utf-8" />
      <meta
        name="viewport"
        content="width=device-width,initial-scale=1,shrink-to-fit=no"
      />
      <meta name="theme-color" content="#057fa5" />
      <meta name="msapplication-TileColor" content="#057fa5" />
      {FAVICON_APPLE_SIZES.map((sizes) => (
        <link
          rel="apple-touch-icon"
          sizes={sizes}
          href={`/assets/catalog/images/favicons/apple-icon-${sizes}.png`}
        />
      ))}
      {FAVICON_ICON.map((icon) => (
        <link
          rel="icon"
          type="image/png"
          sizes={icon.sizes}
          href={`/assets/catalog/images/favicons/${icon.href}`}
        />
      ))}
      {state.matomoIsActive ? (
        <script src="/assets/data-portal/js/matomo.js"></script>
      ) : null}
      <script dangerouslySetInnerHTML={{ __html: GOV_DS_CONFIG_SCRIPT }}></script>
      <link rel="stylesheet" href={ds + "assets/styles/critical.css"} />
      <link rel="stylesheet" href={ds + "/assets/components/core/core.css"} />
      <link rel="stylesheet" href={ds + "assets/fonts/roboto.css"} />
      <script
        type="module"
        src={ds + "/assets/components/core/core.esm.js"}
      ></script>
      <script nomodule src={ds + "/assets/components/core/core.js"}></script>
      <link
        type="text/css"
        rel="stylesheet"
        href="/assets/catalog/css/main.css"
      />
    </>
  );
}
