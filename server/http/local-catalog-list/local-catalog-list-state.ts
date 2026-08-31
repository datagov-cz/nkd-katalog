/**
 * The presenter → view contract for the local-catalog-list route.
 */
import type { Configuration } from "../../configuration.ts";
import type { TranslationService } from "../../service/translation-service.ts";
import type { NavigationEntry } from "../../service/navigation-service.ts";
import type { LinkService } from "../../service/link-service.ts";
import type { HeadData } from "../../component/head.tsx";

export interface LocalCatalogListViewServices {
  configuration: Configuration;
  translation: TranslationService;
  navigation: NavigationEntry;
  link: LinkService;
}

export interface LocalCatalogListCatalog {
  iri: string;
  title: string;
  publisher: { iri: string; label: string };
  contactPoint: { email: string; name: string };
  /** Raw model fields, re-exposed under *Url names by `prepareCatalogsInPlace`. */
  homepage: string;
  endpointURL: string;
  /** Filled by `prepareCatalogsInPlace`. */
  url: string;
  homepageUrl: string;
  endpointUrl: string;
  deleteUrl: string;
  validateUrl: string;
}

/** Model output the view consumes. */
export interface LocalCatalogListData {
  catalogs: LocalCatalogListCatalog[];
}

export interface LocalCatalogListState {
  head: HeadData;
  headerHtml: string;
  footerHtml: string;
  /** Localized strings, resolved by `prepareTemplateData`. */
  pageTitle: string;
  pageDescription: string;
  heading: string;
  homepageLink: string;
  endpointLink: string;
  deleteLink: string;
  validateLink: string;
  message: string;
  catalogs: LocalCatalogListCatalog[];
}
