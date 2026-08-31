/**
 * The presenter → view contract for the suggestion-detail route.
 */
import type { Configuration } from "../../configuration.ts";
import type { NavigationEntry } from "../../service/navigation-service.ts";
import type { TranslationService } from "../../service/translation-service.ts";
import type { HeadData } from "../../component/head.tsx";

export interface SuggestionDetailViewServices {
  configuration: Configuration;
  navigation: NavigationEntry;
  translation: TranslationService;
  http: any;
}

export interface SuggestionDetailQuery {
  iri: string | null;
}

/** A codelist entry; `href` is filled by `updateCodelistInPlace`. */
export interface CodelistItem {
  iri: string;
  label: string;
  href: string;
}

export interface SuggestionDetailDataset {
  iri: string;
  title: string;
  description: string;
  /** Filled by `prepareDatasetsInPlace`. */
  href: string;
}

/** Model output the view consumes (null → not found, handled before render). */
export interface SuggestionDetailData {
  iri: string;
  title: string;
  description: string;
  themes: CodelistItem[];
  state: { label: string } | null;
  created: Date | null;
  mandatory_106: boolean;
  obstacle_special_regulation: boolean;
  obstacle_106: boolean;
  publisher: { iri: string | null; title: string | null };
  publication_plan: string | null;
  datasets: SuggestionDetailDataset[];
}

export interface SuggestionDetailSuggestion {
  iri: string;
  title: string;
  description: string;
  themes: CodelistItem[];
  state: { label: string } | null;
  created: string;
  mandatory_106: boolean;
  obstacle_special_regulation: boolean;
  obstacle_106: boolean;
  publisher: { iri: string | null; title: string | null };
  publication_plan: string | null;
  publication_plan_visible: boolean;
}

export interface SuggestionDetailState {
  head: HeadData;
  headerHtml: string;
  footerHtml: string;
  /** Localized strings, resolved by `prepareTemplateData`. */
  pageTitle: string;
  pageDescription: string;
  goToLink: string;
  dtTheme: string;
  dtCreated: string;
  dtState: string;
  dtPublicationPlan: string;
  dtMandatory106: string;
  dtObstacleSpecial: string;
  dtObstacle106: string;
  yes: string;
  no: string;
  h2Datasets: string;
  suggestion: SuggestionDetailSuggestion;
  datasets: { visible: boolean; items: SuggestionDetailDataset[] };
}
