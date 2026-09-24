/**
 * The presenter → view contract for the suggestion-list route.
 */
import type { Configuration } from "../../configuration.ts";
import type { TranslationService } from "../../service/translation-service.ts";
import type { NavigationEntry } from "../../service/navigation-service.ts";
import type { HeadData } from "../../component/head.tsx";
import type { ResultBarState } from "../../component/result-bar.tsx";
import type { PaginationState } from "../../component/pagination.tsx";
import type { FacetData, FacetItemData } from "../../component/facet.tsx";
import type { SuggestionListQuery } from "./suggestion-list-query.ts";

export type { SuggestionListQuery } from "./suggestion-list-query.ts";

export interface SuggestionListViewServices {
  configuration: Configuration;
  translation: TranslationService;
  navigation: NavigationEntry;
}

export interface SuggestionListDocument {
  iri: string;
  title: string;
  description: string;
  /** Filled by `prepareDocumentsInPlace`. */
  href: string;
  themes: {
    iri: string;
    label: string;
    href: string;
  }[];
}

/** Model output the view consumes. */
export interface SuggestionListData {
  documents: SuggestionListDocument[];
  found: { documents: number } & Record<string, number>;
  facets: Record<string, FacetItemData[]>;
}

export interface SuggestionListState {
  head: HeadData;
  /** URL to page with no filters active. */
  clearFilters: string | null,
  search: { query: { searchQuery: string | null } };
  /** First page of the current results, and the name of the search text parameter. */
  navigation: { url: string; searchName: string };
  resultBar: ResultBarState;
  pagination: PaginationState;
  documents: SuggestionListDocument[];
  facets: FacetData[];
  query: SuggestionListQuery;
}
