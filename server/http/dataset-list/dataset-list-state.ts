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
import type { createQuerySectionData } from "../../component/query-section.tsx";

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
  /** URL to page with no filters active. */
  clearFilters: string;
  search: { query: { searchQuery: string | null } };
  /**
   * First page of the current results, and the names of the query parameters
   * with the search text and the temporal coverage.
   */
  navigation: {
    url: string;
    searchName: string;
    temporalStartName: string;
    temporalEndName: string;
  };
  querySection: QuerySectionViewState;
  resultBar: ResultBarState;
  pagination: PaginationState;
  documents: DatasetListDocument[];
  facets: FacetData[];
  query: DatasetListQuery;
}
