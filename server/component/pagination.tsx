import type { NavigationEntry } from "../service/navigation-service.ts";
import { ViewContext } from "../service/view-context.ts";

export interface PaginationState {
  /**
   * Total number of items (not pages).
   */
  total: number;
  /**
   * Size of a single page.
   */
  pageSize: number;
  /**
   * Zero-based index of a current page from.
   */
  currentPage: number;
  /**
   * Template for pagination navigation.
   * Must contain "_PAGE_" which is replaced with the page index.
   */
  linkTemplate: string;
  /**
   * Template for page size change navigation.
   * Must contain "_PAGE_SIZE_".
   * Set to null to not render page selection.
   */
  pageSizeHref: string | null;
}

/**
 * Only `page` / `pageSize` are read directly; the whole object is spread into
 * `navigation.linkFromServer` at runtime to carry the active filters through.
 */
type PaginationQuery = { page: number; pageSize: number };

export function createPaginationData(
  navigation: NavigationEntry,
  query: PaginationQuery,
  documentsCount: number,
): PaginationState {
  return {
    total: documentsCount,
    pageSize: query.pageSize,
    currentPage: query.page + 1,
    linkTemplate: navigation
      .linkFromServer({ ...query, page: "_PAGE_" })
      // We need '{PAGE}' in the link template for the design system.
      .replace("_PAGE_", "{PAGE}"),
    pageSizeHref: navigation.linkFromServer({
      ...query,
      page: 0,
      pageSize: "_PAGE_SIZE_",
    }),
  };
}

export function Pagination({ state, ctx }: {
  state: PaginationState,
  ctx: ViewContext,
}) {
  const hide = state.total <= state.pageSize;
  return (
    <>
      <br />
      <gov-grid gap="l" class="gov-card-grid">
        <gov-grid-item col-span="12" col-span-md="10">
          {hide ? null :
            <gov-pagination
              color="primary"
              type="button"
              size="m"
              current={String(state.currentPage)}
              total={String(state.total)}
              page-size={state.pageSize}
              max-pages="8"
              link={state.linkTemplate}
            />
          }
        </gov-grid-item>
        {state.pageSizeHref === null ? null :
          <gov-grid-item col-span="12" col-span-md="2">
            <gov-form-select
              wcag-label={ctx.t("pagination-page-size")}
              value={String(state.pageSize)}
              data-href={state.pageSizeHref}
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="75">75</option>
              <option value="100">100</option>
            </gov-form-select>
          </gov-grid-item>
        }
      </gov-grid>
    </>
  );
}