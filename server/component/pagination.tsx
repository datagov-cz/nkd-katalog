import type { NavigationEntry } from "../service/navigation-service.ts";
import type { TranslationService } from "../service/translation-service.ts";

export interface PaginationState {
  visible: boolean;
  total: number;
  pageSize: number;
  currentPage: number;
  linkTemplate: string;
  pageSizeHref: string;
  /** Localized strings, resolved by {@link createPaginationData}. */
  wcagLabel: string;
  wcagSelectLabel: string;
  wcagPageSizeLabel: string;
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
  translation: TranslationService,
): PaginationState {
  return {
    visible: documentsCount > query.pageSize,
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
    wcagLabel: translation.dictionary["pagination-label"],
    wcagSelectLabel: translation.dictionary["pagination-select-label"],
    wcagPageSizeLabel: translation.dictionary["pagination-page-size"],
  };
}

export function Pagination({ state }: { state: PaginationState }) {
  return (
    <gov-grid>
      <gov-grid-item size-sm="12/12" size-md="10/12">
        {state.visible ? (
          <gov-pagination
            total={String(state.total)}
            current={String(state.currentPage)}
            page-size={String(state.pageSize)}
            wcag-label={state.wcagLabel}
            wcag-select-label={state.wcagSelectLabel}
            link={state.linkTemplate}
          ></gov-pagination>
        ) : null}
      </gov-grid-item>
      <gov-grid-item size-sm="4/12" size-md="2/12" id="page-size">
        <gov-form-select
          wcag-label={state.wcagPageSizeLabel}
          value={String(state.pageSize)}
          data-href={state.pageSizeHref}
        >
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="75">75</option>
          <option value="100">100</option>
        </gov-form-select>
      </gov-grid-item>
    </gov-grid>
  );
}
