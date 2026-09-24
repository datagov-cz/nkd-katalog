import type { FunctionComponent } from "preact";

import { OpenFacet, type FacetData } from "./facet.tsx";
import { ListSearchHeader } from "./list-search-header.tsx";
import { ListSearchControls } from "./list-search-controls.tsx";
import { ListOfItems } from "./list-search-items.tsx";
import type { PaginationState } from "./pagination.tsx";
import type { ResultBarState } from "./result-bar.tsx";
import type { ViewContext } from "../service/view-context.ts";

/**
 * Main section of a list page: facets on the left, search header, controls
 * and paginated list of items on the right.
 */
export function ListSearchPage<ItemType>({ state, ctx }: {
  state: {
    /**
     * URL of the first page of the current results, with all filters kept.
     * The client changes a single query parameter of it and navigates.
     */
    navigationUrl: string,
    /** Name of the query parameter with the search text. */
    searchNavigationName: string,
    /** Current search query, shown in the heading and the search input. */
    searchQuery: string | null,
    facets: FacetData[],
    resultBar: ResultBarState,
    /** Link to a page with all filters disabled. */
    clearFilters: string | null,
    items: ItemType[],
    pagination: PaginationState,
    component: FunctionComponent<{ value: ItemType, ctx: ViewContext }>,
  },
  ctx: ViewContext,
}) {
  const filters: { label: string, ariaLabel: string, href: string }[] = [];
  for (const facet of state.facets) {
    for (const item of facet.items) {
      if (!item.active) {
        continue;
      }
      const label = item.label ?? item.iri;
      filters.push({
        href: item.href,
        label,
        ariaLabel: ctx.t("cancel-filter", label),
      });
    }
  }
  const ordering = state.resultBar.ordering;
  //
  const facets = (
    <>
      {state.facets.map(item => <OpenFacet ctx={ctx} state={item} />)}
    </>
  );
  return (
    <gov-container data-navigation-url={state.navigationUrl}>
      <gov-layout type="aside" variant="left">
        <gov-layout-column class="gov-desktop-only">
          <aside aria-label={ctx.t("search-result-filters")}>
            <form class="gov-filters">
              <gov-flex direction="column" gap="s">
                {facets}
              </gov-flex>
            </form>
          </aside>
        </gov-layout-column>
        <gov-layout-column>
          <main>
            <ListSearchHeader state={{ value: state.searchQuery, navigationName: state.searchNavigationName }} ctx={ctx} />
            <gov-flex direction="column" gap="xl">
              <ListSearchControls state={{
                message: state.resultBar.message,
                ordering: {
                  active: ordering.items.find(item => item.href === ordering.active)
                    ?? ordering.items[0],
                  items: ordering.items,
                },
                filters,
                clearFilters: state.clearFilters,
              }} ctx={ctx} facets={facets} />
              <ListOfItems state={{
                items: state.items,
                pagination: state.pagination,
                component: state.component,
              }} ctx={ctx} />
            </gov-flex>
          </main>
        </gov-layout-column>
      </gov-layout>
    </gov-container>
  );
}
