import type { NavigationEntry } from "../service/navigation-service.ts";

/**
 * Join a site origin (no trailing slash) with a path, for canonical/hreflang
 * URLs. `NavigationEntry.linkFromServer` returns paths without a leading
 * slash (e.g. "datasets", not "/datasets"), so one is inserted if missing.
 */
export function absoluteUrl(origin: string, path: string): string {
  return origin + (path.startsWith("/") ? path : "/" + path);
}

export interface SeoLinks {
  canonical: string;
  alternateCs: string;
  alternateEn: string;
}

type ServerQuery = Parameters<NavigationEntry["linkFromServer"]>[0];

/**
 * Build absolute canonical/hreflang links for a detail page: the page is
 * identified entirely by `query` (e.g. `{ iri }`), so the canonical is that
 * same query on the current-language navigation, normalized by
 * `linkFromServer` (which already drops anything at its default value).
 */
export function buildDetailSeoLinks(
  navigation: NavigationEntry,
  siteOrigin: string,
  query: ServerQuery,
): SeoLinks {
  return {
    canonical: absoluteUrl(siteOrigin, navigation.linkFromServer(query)),
    alternateCs: absoluteUrl(
      siteOrigin, navigation.changeLanguage("cs").linkFromServer(query)),
    alternateEn: absoluteUrl(
      siteOrigin, navigation.changeLanguage("en").linkFromServer(query)),
  };
}

export interface ListSeo<Query> {
  /** Query to build the canonical URL from; already normalized. */
  canonicalQuery: Partial<Query>;
  /** Whether the *current* request (not the canonical target) is noindex. */
  noindex: boolean;
}

/**
 * Decide the canonical, indexable form of a faceted list page, and whether
 * the current request should be `noindex`.
 *
 * A page is indexable when it is either the plain, unfiltered list, or uses
 * exactly one value of exactly one facet from `indexableFacets` and nothing
 * else (checked with `isEmpty`, which already ignores pagination, sort and
 * the `*Limit` facet-size settings) — and is on the first page. Anything
 * else (a second filter, an un-whitelisted facet, free-text search, or page
 * 2+) is `noindex`, with the canonical pointing at that one indexable form
 * (or the bare list, for a page 2+ of the unfiltered list).
 *
 * A non-default sort order never triggers `noindex` on its own: it doesn't
 * change the result set, only its order, so it's left out of
 * `canonicalQuery` and the canonical simply points at the default-sort
 * version of whichever indexable page this is.
 */
export function computeListSeo<Query extends { page: number }>(
  query: Query,
  indexableFacets: (keyof Query)[],
  isEmpty: (query: Query) => boolean,
): ListSeo<Query> {
  for (const facet of indexableFacets) {
    const values = query[facet] as unknown as string[];
    if (values.length === 1 && isEmpty({ ...query, [facet]: [] })) {
      return {
        canonicalQuery: { [facet]: values } as Partial<Query>,
        noindex: query.page > 0,
      };
    }
  }
  if (isEmpty(query)) {
    return { canonicalQuery: {}, noindex: query.page > 0 };
  }
  return { canonicalQuery: {}, noindex: true };
}

/**
 * Build the absolute canonical/hreflang links plus the `noindex` flag for a
 * faceted list page, from the result of `computeListSeo`.
 */
export function buildListSeoLinks<Query extends { page: number }>(
  navigation: NavigationEntry,
  siteOrigin: string,
  seo: ListSeo<Query>,
): SeoLinks & { noindex: boolean } {
  const query = seo.canonicalQuery as ServerQuery;
  return {
    ...buildDetailSeoLinks(navigation, siteOrigin, query),
    noindex: seo.noindex,
  };
}
