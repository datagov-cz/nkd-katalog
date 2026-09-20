import { VNode } from "preact";
import { render } from "preact-render-to-string/jsx";

/**
 * Render a Preact element to an HTML string, server-side only, no hydration.
 *
 * Uses the plain (non-pretty) renderer on purpose: pretty-printing inserts
 * whitespace that fights the golden-file normalizer during the
 * Handlebars -> JSX migration.
 */
export function renderToHtml(element: VNode<{}>): string {
  return render(element, {});
}

/** As {@link renderToHtml} but prefixed with the HTML5 doctype. */
export function renderDocumentToHtml(element: VNode<{}>): string {
  return "<!DOCTYPE html>\n" + render(element);
}
