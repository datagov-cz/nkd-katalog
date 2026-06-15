import { getString } from "./jsonld.mjs";

/**
 * @param {string[] | null | undefined} languages Unused as we retrieve all data.
 * @param {*} response Response object with "jsonld" field.
 * @param {string | string[]} predicate Single predicate or array.
 * @returns {{[language: string]: string}}
 */
export function parseLabelResponse(languages, response, predicate) {
  if (response["error"] !== undefined) {
    return null;
  }
  const jsonld = response["jsonld"];
  if (jsonld === undefined) {
    return {};
  }
  const resource = jsonld[0];
  if (resource === undefined) {
    return {};
  }
  if (Array.isArray(predicate)) {
    /** @type {{ [language: string]: string }} */
    let result = {};
    for (const item of predicate) {
      result = {
        ...result,
        ...(getString(resource, item) ?? {}),
      };
    }
    return result;
  } else {
    return getString(resource, predicate);
  }
}

/**
 * @param {string[] | null | undefined} languages
 * @param {object} values With {language: string}.
 * @returns {string | null} Null only for null and undefined.
 */
export function selectForLanguages(languages, values) {
  if (values === null || values === undefined) {
    return null;
  }
  for (const language of languages) {
    if (values[language] === undefined) {
      continue;
    }
    return values[language];
  }
  return Object.values(values)[0] ?? null;
}
