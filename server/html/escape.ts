/**
 * HTML-escape a string the same way Handlebars' `{{expression}}` does
 * (`Handlebars.Utils.escapeExpression`), so JSX ports that need raw-HTML output
 * (`dangerouslySetInnerHTML`) stay byte-identical to the templates they replace.
 */
const ESCAPE: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "`": "&#x60;",
  "=": "&#x3D;",
};

const BAD_CHARS = /[&<>"'`=]/;
const POSSIBLE_CHARS = /[&<>"'`=]/g;

export function escapeExpression(value: unknown): string {
  const text = value == null ? "" : String(value);
  if (!BAD_CHARS.test(text)) {
    return text;
  }
  return text.replace(POSSIBLE_CHARS, (char) => ESCAPE[char]);
}

/** `{{breaklines value}}`: escape, then turn line endings into `<br>`. */
export function breakLines(value: unknown): string {
  return escapeExpression(value).replace(/(\r\n|\n|\r)/gm, "<br>");
}

/**
 * Collapse whitespace and cut a text to at most `maxLength` characters, on a
 * word boundary, for use as a `<meta name="description">` value. Returns
 * `null` for empty input, so callers can fall back to a static description.
 */
export function truncateForMetaDescription(
  value: string | null | undefined, maxLength = 155,
): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const text = value.replace(/\s+/g, " ").trim();
  if (text === "") {
    return null;
  }
  if (text.length <= maxLength) {
    return text;
  }
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + "…";
}
