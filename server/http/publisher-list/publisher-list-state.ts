/**
 * The presenter → view contract for the publisher-list route.
 */
import type { Configuration } from "../../configuration.ts";
import type { TranslationService } from "../../service/translation-service.ts";
import type { NavigationEntry } from "../../service/navigation-service.ts";
import type { HeadData } from "../../component/head.tsx";

export interface PublisherListViewServices {
  configuration: Configuration;
  translation: TranslationService;
  navigation: NavigationEntry;
}

export interface PublisherListPublisher {
  iri: string;
  label: string;
  count: number;
  vdfOriginator: boolean;
  vdfPublisher: boolean;
  /** Filled by `preparePublishersInPlace`. */
  href: string;
  dashboardDaily: string;
  dashboardMonthly: string;
  message: string;
  badges: { vdf: boolean; vdfOriginator: boolean; vdfPublisher: boolean };
}

/** Model output the view consumes. */
export interface PublisherListData {
  publishers: PublisherListPublisher[];
}

export interface PublisherListState {
  head: HeadData;
  publishers: PublisherListPublisher[];
  query: Record<string, string | string[]>;
}
