/**
 * Ambient JSX declarations for the gov.cz design-system web components.
 */
import { } from "preact";

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
