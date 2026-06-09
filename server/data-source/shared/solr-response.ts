import logger from "../../logger.ts";

/**
 * Combine name_prefix with languages returning the first non-empty value found.
 */
export function selectLanguage(
  document: Record<string, any>,
  name_prefix: string,
  languages: string[],
): string | null {
  for (const language of languages) {
    const key = name_prefix + language;
    const value = document[key];
    if (isEmpty(value)) {
      continue;
    }
    return value;
  }
  return null;
}

export function emptyAsNull(value: undefined | null | string): string | null {
  if (isEmpty(value)) {
    return null;
  } else {
    return value ?? null;
  }
}

function isEmpty(value: undefined | null | string): boolean {
  return value === undefined || value === null || value.trim() === "";
}

export interface FacetItem {
  iri: string;
  count: number;
}

/**
 * Parse facet data from a Solr response.
 */
export function parseFacet(payload: undefined | string[]): FacetItem[] {
  if (payload == undefined) {
    return [];
  }
  const result: FacetItem[] = [];
  for (let index = 0; index < payload.length; index += 2) {
    result.push({
      iri: payload[index],
      count: Number(payload[index + 1]),
    });
  }
  result.sort((left, right) => right.count - left.count);
  return result;
}

export function parseDate(value: string | undefined): Date | null {
  if (value == undefined) {
    return null;
  }
  const result = new Date(value);
  if (isNaN(result.getDate())) {
    logger.info("Failed to parse invalid date '%s'.", value);
    return null;
  }
  return result;
}
