/**
 * @param {import('../../service/navigation-service.ts').NavigationEntry} navigation
 * @param {Record<string, string | string[]>} query
 * @returns {{ iri: string | null }}
 */
export function parseClientQuery(navigation, query) {
  return {
    "iri": navigation.queryArgumentFromClient(query, "iri"),
  };
}
