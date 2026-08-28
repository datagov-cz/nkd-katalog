/**
 * The presenter → view contract for the application-detail route.
 */
import type { Configuration } from "../../configuration.ts";
import type { NavigationEntry } from "../../service/navigation-service.ts";
import type { HandlebarsService } from "../../handlebars/index.ts";
import type { HeadData } from "../../component/head.ts";

export interface ApplicationDetailViewServices {
  configuration: Configuration;
  navigation: NavigationEntry;
  template: HandlebarsService;
  http: any;
}

export interface ApplicationDetailQuery {
  iri: string | null;
}

/** A codelist entry; `href` is filled by `updateCodelistInPlace`. */
export interface CodelistItem {
  iri: string;
  label: string;
  href: string;
}

export interface ApplicationDetailDataset {
  iri: string;
  title: string;
  description: string;
  /** Filled by `prepareDatasetsInPlace`. */
  href: string;
}

/** Model output the view consumes (null → not found, handled before render). */
export interface ApplicationDetailData {
  author: { title: string | null; iri: string | null };
  title: string;
  description: string;
  states: CodelistItem[];
  themes: CodelistItem[];
  platforms: CodelistItem[];
  types: CodelistItem[];
  published: Date | null;
  modified: Date | null;
  link: string;
  datasets: ApplicationDetailDataset[];
}

export interface ApplicationDetailApplication {
  author: {
    title: string | null;
    titleVisible: boolean;
    iri: string | null;
    iriVisible: boolean;
  };
  title: string;
  description: string;
  states: CodelistItem[];
  themes: CodelistItem[];
  platforms: CodelistItem[];
  types: CodelistItem[];
  published: string;
  modified: string;
  link: string;
}

export interface ApplicationDetailState {
  head: HeadData;
  headerHtml: string;
  footerHtml: string;
  application: ApplicationDetailApplication;
  datasets: { visible: boolean; items: ApplicationDetailDataset[] };
}
