// Ambient JSX declarations for the gov.cz design-system web components.
//
// The design system ships dozens of `gov-*` custom elements. Rather than
// enumerate them, allow any `gov-*` tag with a permissive attribute bag:
// standard HTML attributes (`class`, `slot`, `id`, ...) plus arbitrary
// kebab-case props (`wcag-label`, `size-md`, `page-size`, ...) and `data-*`.
// Preact passes unknown attributes through unchanged.

import {} from "preact";

type GovElementAttributes = preact.JSX.HTMLAttributes<HTMLElement> & {
  [attribute: string]: unknown;
};

declare module "preact" {
  namespace JSX {
    interface IntrinsicElements {
      [tag: `gov-${string}`]: GovElementAttributes;
    }
  }
}
