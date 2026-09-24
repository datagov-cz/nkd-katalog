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
import type { DatasetListQuery } from "./dataset-list-query.ts";

export type { DatasetListQuery } from "./dataset-list-query.ts";

export type QuerySectionViewState = ReturnType<typeof createQuerySectionData>;

export interface DatasetListViewServices {
  configuration: Configuration;
  translation: TranslationService;
  navigation: NavigationEntry;
}

/** A dataset card, after `updateDatasetsInPlace` and `prepareDocumentsInPlace`. */
export interface DatasetListDocument {
  iri: string;
  applicableLegislation: [];
  title: string;
  description: string;
  /** Added by `prepareDocumentsInPlace`. */
  href: string;
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
  clearFilters: string | null,
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
