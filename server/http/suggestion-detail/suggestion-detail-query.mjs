/**
 * @param {import('../../service/navigation-service.mjs').IViewBoundNavigation} navigation
 * @param {Record<string, string | string[]>} query
 * @returns {{ iri: string | null }}
 */
export function parseClientQuery(navigation, query) {
  return {
    "iri": navigation.queryArgumentFromClient(query, "iri"),
  };
}
