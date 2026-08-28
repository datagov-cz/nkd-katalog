/**
 * The presenter → view contract for the suggestion-list route.
 */
import type { Configuration } from "../../configuration.ts";
import type { TranslationService } from "../../service/translation-service.ts";
import type { NavigationEntry } from "../../service/navigation-service.ts";
import type { HandlebarsService } from "../../handlebars/index.ts";
import type { HeadData } from "../../component/head.ts";
import type { ResultBarData } from "../../component/result-bar.mjs";
import type { PaginationData } from "../../component/pagination.mjs";
import type { FacetData, FacetItemData } from "../../component/facet.mjs";

export interface SuggestionListViewServices {
  configuration: Configuration;
  translation: TranslationService;
  navigation: NavigationEntry;
  template: HandlebarsService;
}

/**
 * Parsed client query. The view only reads `searchQuery` by name; every other
 * key is passed straight through to `navigation.linkFromServer`.
 */
export interface SuggestionListQuery {
  searchQuery: string | null;
  [key: string]: string | number | boolean | string[] | null | undefined;
}

export interface SuggestionListDocument {
  iri: string;
  title: string;
  description: string;
  /** Filled by `prepareDocumentsInPlace`. */
  href: string;
  themes: { iri: string; label: string; href: string }[];
}

/** Model output the view consumes. */
export interface SuggestionListData {
  documents: SuggestionListDocument[];
  found: { documents: number } & Record<string, number>;
  facets: Record<string, FacetItemData[]>;
}

export interface SuggestionListState {
  head: HeadData;
  headerHtml: string;
  footerHtml: string;
  search: { value: string | null; "clear-href": string; "search-href": string };
  "result-bar": ResultBarData;
  pagination: PaginationData;
  documents: SuggestionListDocument[];
  facets: FacetData[];
}
