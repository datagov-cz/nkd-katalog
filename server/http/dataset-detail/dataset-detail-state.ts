/**
 * The presenter → view contract for the dataset-detail route.
 *
 * `DatasetDetailQuery` is what the view reads from the parsed query;
 * `DatasetDetailState` is what `prepareTemplateData` hands to the template.
 * Kept separate from `dataset-detail-model`, which describes the store shape.
 */
import type { Configuration } from "../../configuration.ts";
import type { NavigationEntry } from "../../service/navigation-service.ts";
import type { LinkService } from "../../service/link-service.ts";
import type {
  TranslationDictionary,
  TranslationService,
} from "../../service/translation-service.ts";
import type { HeadData } from "../../component/head.tsx";

export interface DatasetDetailViewServices {
  http: any;
  configuration: Configuration;
  navigation: NavigationEntry;
  translation: TranslationService;
  link: LinkService;
}

export interface DatasetDetailQuery {
  iri: string;
  distributionPage: number;
  distributionPageSize: number;
}

/**
 * Capture information required for rendering.
 */
export interface DatasetDetailState {

  head: HeadData;

  translation: TranslationDictionary;

  labelEndpoint: string;

  metadataAsString: string;

  applications: {
    visible: boolean;
    items: {
      href: string;
      title: string;
      description: string;
    }[];
  };

  dataset: {
    iri: string;
    heading: HeadingViewModel;
    publisher: HrefLabel | null;
    description: string;
    applicableLegislation: ApplicableLegislationItem[];
    keywords: HrefLabel[];
    themesVisible: boolean;
    themes: HrefLabelIri[];
    euroVocThemesVisible: boolean;
    euroVocThemes: HrefLabelIri[];
    spatialVisible: boolean;
    spatial: IriLabel[];
    spatialResolutionInMetersVisible: boolean;
    spatialResolutionInMeters: string;
    temporalVisible: boolean;
    temporal: string;
    temporalResolutionVisible: boolean;
    temporalResolution: string;
    documentation: string[];
    contactVisible: boolean;
    contact: HrefLabel[];
    conformsToVisible: boolean;
    conformsTo: HrefLabel[];
    frequencyVisible: boolean;
    frequency: IriLabel | null;
    hvdCategoryVisible: boolean;
    hvdCategory: HrefLabelIri[];
    parentDataset: HrefLabel | null;
    landingPage: string | null;
    publicInformationSystem: HrefLabel[];
    concernTerm: {
      url: string;
      viewer: string;
    }[];
    //
    isOpenData: boolean;
    isNonPublicData: boolean;
  };

  distributions: Distributions;

  datasetSeries: {
    visible: boolean;
    total: number;
    showAllHref: string;
    items: {
      href: string;
      title: string;
      description: string;
    }[];
  };

  query: DatasetDetailQuery;

}

export interface HeadingViewModel {
  title: string;
  openUrl: string;
  editUrl: string | null;
  copyUrl: string | null;
  deleteDatasetUrl: string | null;
  deleteCatalogUrl: string | null;
}

export interface ApplicableLegislationItem {
  url: string;
  label: string;
  /* When set render as a chip in the heading section. */
  chip: {
    variant: string;
    label: string;
  } | null;
}

export interface HrefLabelIri {
  href: string;
  label: string;
  iri: string;
}

export interface IriLabel {
  iri: string;
  label: string;
}

export interface HrefLabel {
  href: string;
  label: string;
}

export interface Distributions {
  visible: boolean;
  items: DistributionItemState[];
  pagination: {
    visible: boolean;
    total: number;
    currentPage: number;
    pageSize: number;
    linkTemplate: string;
  };
}

export interface DistributionItemState {
  sizeMd: string;
  sizeLg: string;
  //
  iri: string;
  title: string;
  format: string;
  applicableLegislation: ApplicableLegislationItem[];
  missingLegal: boolean;
  dcatApLegal: boolean;
  dcatApCzLegal: DcatApCzLegal | null;
  showSharingSpecifications: boolean;
  sharedInterfaceContentType: HrefLabel[];
  sharedInterfaceKind: HrefLabel[];
  sharedInterfaceAccessType: HrefLabel[];
  facilitatesSharingCount: number;
  /** `{{t "facilitates-sharing" count}}`, resolved in the mapper. */
  facilitatesSharingText: string;
  facilitatesSharing: FacilitatesSharingItem[];
  // Type specific.
  distribution: FileDistribution | null;
  dataService: DataService | null;
}

export interface DcatApCzLegal {
  authorship: LicenseCondition;
  databaseAuthorship: LicenseCondition;
  protectedDatabaseAuthorship: LicenseCondition;
  personalData: IconLabelViewModel;
}

export interface LicenseCondition {
  showQuality: boolean;
  href: string | null;
  label: string;
  icon: string;
  iconColor: string;
  iconTitle: string;
  iconType?: string;
  author: string | null;
}

export interface IconLabelViewModel {
  label: string;
  icon: string;
  iconColor: string;
  iconTitle: string;
  iconType?: string;
}

export interface FacilitatesSharingItem {

  sharedAs: HrefLabel | null;

  sharedBy: HrefLabel | null;

  obtainedBy: HrefLabel | null;

  correspondingTerm: string | null;

  correspondingTermViewer: string | null;

}

export interface FileDistribution {
  downloadArray: string[];
  access: string | null;
  conformsTo: string[];
  mediaType: HrefLabel | null;
  compressFormat: HrefLabel | null;
  packageFormat: HrefLabel | null;
}

export interface DataService {
  iri: string;
  endpointDescription: string;
  access: string | null;
  endpointUrl: string;
  /* Should be visible when set and data service conforms to https://www.w3.org/TR/sparql11-protocol/ */
  sparqlEditor: string | null;
  /* Should be visible when set and data service conforms to https://www.w3.org/TR/sparql11-protocol/ */
  classesAndProperties: string | null;
  conformsTo: string[];
  documentation: string[];
  contact: HrefLabel[];
}
