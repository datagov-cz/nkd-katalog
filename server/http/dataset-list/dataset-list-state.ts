/**
 * The presenter → view contract for the dataset-list route.
 *
 * `DatasetListQuery` and `DatasetListData` are what the view reads from the
 * parsed query and the model output; `DatasetListState` is what
 * `prepareTemplateData` hands to the template. Kept separate from
 * `dataset-list-model`, which describes the store shape.
 */
import type { Configuration } from "../../configuration.ts";
import type { TranslationService } from "../../service/translation-service.ts";
import type { NavigationEntry } from "../../service/navigation-service.ts";
import type { HeadData } from "../../component/head.tsx";
import type { ResultBarState } from "../../component/result-bar.tsx";
import type { PaginationState } from "../../component/pagination.tsx";
import type { FacetData, FacetItemData } from "../../component/facet.tsx";
import type { createQuerySectionData } from "../../component/query-section/index.ts";

export type QuerySectionViewState = ReturnType<typeof createQuerySectionData>;

export interface DatasetListViewServices {
  configuration: Configuration;
  translation: TranslationService;
  navigation: NavigationEntry;
}

/** Parsed client query, as produced by `parseClientQuery`. */
export interface DatasetListQuery {
  searchQuery: string | null;
  publisher: string[];
  publisherLimit: number;
  theme: string[];
  themeLimit: number;
  keyword: string[];
  keywordLimit: number;
  format: string[];
  formatLimit: number;
  dataServiceType: string[];
  dataServiceTypeLimit: number;
  temporalStart: string | null;
  temporalEnd: string | null;
  vdfPublicData: boolean;
  vdfCodelist: boolean;
  isPartOf: string[];
  sort: string;
  sortDirection: string;
  page: number;
  pageSize: number;
  hvdDataset: boolean;
  datasetType: string[];
  datasetTypeLimit: number;
  hvdCategory: string[];
  hvdCategoryLimit: number;
  isvs: string[];
  isvsLimit: number;
  [key: string]: string | number | boolean | string[] | null | undefined;
}

/** A dataset card, after `updateDatasetsInPlace` and `prepareDocumentsInPlace`. */
export interface DatasetListDocument {
  iri: string;
  title: string;
  description: string;
  /** Added by `prepareDocumentsInPlace`. */
  href: string;
  isHvd: boolean;
  isDynamicData: boolean;
  isOpenData: boolean;
  isNonPublicData: boolean;
  format: {
    iri: string;
    label: string;
    /** `format-tooltip` with the label substituted, resolved in the mapper. */
    tooltip: string;
  }[];
}

/** Model output the view consumes. */
export interface DatasetListData {
  documents: DatasetListDocument[];
  /** `documents` = total hits; every other key = a facet's option count. */
  found: { documents: number } & Record<string, number>;
  /** Facet options keyed by facet name, including the `isPartOf` series facet. */
  facets: Record<string, FacetItemData[]>;
}

export interface DatasetListState {
  head: HeadData;
  headerHtml: string;
  footerHtml: string;
  /** Localized strings, resolved by `prepareTemplateData`. */
  pageTitle: string;
  pageDescription: string;
  searchPlaceholder: string;
  searchInputLabel: string;
  wcagSearch: string;
  searchButton: string;
  extendedSearch: string;
  temporalFrom: string;
  temporalTo: string;
  thisYear: string;
  lastYear: string;
  clearFiltersLabel: string;
  clearFilters: string;
  hvdTooltip: string;
  openData: string;
  nonPublicData: string;
  dynamicChip: string;
  dynamicTooltip: string;
  jsSearchQuery: string;
  jsTemporalFrom: string;
  jsTemporalTo: string;
  jsPublicData: string;
  jsCodelist: string;
  search: {
    "clear-href": string;
    "base-url": string;
    query: {
      searchQuery: string | null;
      temporalFrom: string | null;
      temporalTo: string | null;
      publicData: boolean;
      codelist: boolean;
      hvdDataset: boolean;
      datasetType: string[];
      isvs: string[];
    };
    queryObjectAsString: string;
  };
  "query-section": QuerySectionViewState;
  "result-bar": ResultBarState;
  pagination: PaginationState;
  documents: DatasetListDocument[];
  facets: FacetData[];
}
