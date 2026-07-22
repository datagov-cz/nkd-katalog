import { FastifyReply } from "fastify";
import { Language } from "../../localization/index.ts";
import {
  DatasetDetailViewModel,
  Distributable,
  isDataService,
  isFileDistribution,
  FacilitatesSharing,
} from "./dataset-detail-model.ts";
import {
  createHeadData,
  createFooterData,
  createNavigationData,
} from "../../component/index.mjs";
import configuration, { Configuration } from "../../configuration.ts";
import { NavigationEntry } from "../../service/navigation-service.ts";
import { LinkService } from "../../service/link-service.ts";
import { TranslationService } from "../../service/translation-service.ts";
import { NKOD } from "../../data-source/shared/vocabulary.ts";
import { ROUTE } from "../route-name.mjs";
import { HandlebarsService } from "../../handlebars/index.ts";

export function renderHtml(
  services: {
    http: any,
    configuration: Configuration,
    navigation: NavigationEntry,
    translation: TranslationService,
    template: HandlebarsService,
    link: LinkService,
  },
  languages: Language[],
  data: DatasetDetailViewModel | null,
  query: {
    iri: string,
    distributionPage: number,
    distributionPageSize: number,
  },
  reply: FastifyReply,
) {

  if (data == null) {
    services.http.handleNotFound(services, reply);
    return;
  }

  const templateData = prepareTemplateData(
    services.configuration, services.translation, services.navigation,
    services.link, languages, data, query);

  // reply
  //   .code(200)
  //   .header("Content-Type", "text/json; charset=utf-8")
  //   .send({data, template: templateData});

  const template = services.template.view(ROUTE.DATASET_DETAIL);

  reply
    .code(200)
    .header("Content-Type", "text/html; charset=utf-8")
    .send(template(templateData));

}

export function prepareTemplateData(
  configuration: Configuration,
  translation: TranslationService,
  navigation: NavigationEntry,
  link: LinkService,
  languages: Language[],
  data: DatasetDetailViewModel,
  query: {
    iri: string,
    distributionPage: number,
    distributionPageSize: number,
  },
): DatasetDetailTemplateModel {
  const { applications, dataset, distributions, series } = data;

  const heading: HeadingViewModel = {
    title: dataset.title,
    openUrl: link.wrapLink(dataset.iri),
    copyUrl: configuration.client.catalogFormUrl
      + translation.translate("url-copy-dataset")
      + encodeURIComponent(dataset.iri),
    editUrl: null,
    deleteDatasetUrl: null,
    deleteCatalogUrl: null,
  };

  // Fill in heading based on the dataset type.
  if (dataset.type.includes(NKOD.SourceForm)) {
    heading.editUrl = configuration.client.catalogFormUrl
      + translation.translate("url-edit-dataset")
      + encodeURIComponent(dataset.iri);
    heading.deleteDatasetUrl = configuration.client.catalogFormUrl
      + translation.translate("url-delete-dataset")
      + encodeURIComponent(dataset.iri);
  } else if (dataset.type.includes(NKOD.SourceLkod)) {
    // TODO Check for array size.
    heading.deleteCatalogUrl = configuration.client.catalogFormUrl
      + translation.translate("url-delete-catalog")
      + encodeURIComponent(dataset.localCatalog[0].url);
  }

  const datasetDetailNavigation = navigation.changeView(ROUTE.DATASET_DETAIL);
  const datasetListNavigation = navigation.changeView(ROUTE.DATASET_LIST);
  const applicationDetailNavigation = navigation.changeView(ROUTE.APPLICATION_DETAIL);

  return {
    head: createHeadData(configuration),
    labelEndpoint: configuration.client.conceptSparql,
    navigation: createNavigationData(navigation, languages, query) as any,
    footer: createFooterData(),
    dataset: {
      iri: dataset.iri,
      heading,
      publisher: {
        label: dataset.publisher.label,
        href: datasetListNavigation.linkFromServer({
          publisher: [dataset.publisher.url]
        }),
      },
      description: dataset.description,
      keywords: dataset.keywords.map(keyword => ({
        label: keyword,
        href: datasetListNavigation.linkFromServer({ keyword: [keyword] }),
      })),
      themesVisible: dataset.themes.length > 0,
      themes: dataset.themes.map(item => ({
        iri: item.url,
        label: item.label,
        href: datasetListNavigation.linkFromServer({ theme: [item.url] }),
      })),
      euroVocThemesVisible: dataset.euroVocThemes.length > 0,
      euroVocThemes: dataset.euroVocThemes.map(item => ({
        iri: item.url,
        label: item.label,
        href: datasetListNavigation.linkFromServer({ theme: [item.url] }),
      })),
      // [Vztahy ze sémantického slovníku]( configuration.semanticVisualisation + encodeURIComponent(dataset.iri))
      // [Pojmy ze sémantického slovníku](datasetSearchUrl = theme) [](configuration.semanticBrowser + encodeURIComponent(iri))
      // "semanticThemesVisible": dataset.semanticThemes.length > 0,
      // "semanticThemes": dataset.semanticThemes,
      spatialVisible: dataset.spatial.length > 0,
      spatial: dataset.spatial.map(({ label, url }) => ({ iri: url, label })),
      //
      spatialResolutionInMetersVisible: dataset.spatialResolutionInMeters !== null,
      spatialResolutionInMeters: dataset.spatialResolutionInMeters === null ? null : String(dataset.spatialResolutionInMeters),
      //
      temporalResolutionVisible: dataset.temporalResolution !== null,
      temporalResolution: xsdDurationToString(translation, dataset.temporalResolution),
      //
      temporalVisible: dataset.temporal !== null,
      temporal: dataset.temporal === null ? null : temporalAsString(dataset.temporal),
      //
      documentation: dataset.documentation.map(item => item.url),
      //
      contactVisible: dataset.contact.length > 0,
      contact: dataset.contact.map(item => ({
        label: item.label ?? item.email,
        href: "mailto:" + item.email,
      })),
      //
      conformsToVisible: dataset.conformsTo.length > 0,
      conformsTo: dataset.conformsTo.map(item => ({
        href: item.url,
        label: item.label ?? translation.translate("show-specification"),
      })),
      //
      frequencyVisible: dataset.frequency !== null,
      frequency: dataset.frequency === null ? null : {
        iri: dataset.frequency.url,
        label: dataset.frequency.label,
      },
      //
      parentDataset: dataset.partOfSeries === null ? null : {
        href: datasetDetailNavigation.linkFromServer({
          iri: dataset.partOfSeries.url
        }),
        label: dataset.partOfSeries.label,
      },
      //
      hvdCategoryVisible: dataset.hvdCategory.length > 0,
      hvdCategory: dataset.hvdCategory.map(item => ({
        iri: item.url,
        href: datasetListNavigation.linkFromServer({ hvdCategory: [item.url] }),
        label: item.label,
      })),
      //
      applicableLegislation: prepareApplicableLegislation(dataset.applicableLegislation),
      //
      landingPage: dataset.landingPage[0]?.url ?? null,
      publicInformationSystem: dataset.publicInformationSystem.map(asHrefLabel),
      concernTerm: dataset.concernTerm.map(item => {
        const viewer = configuration.client.conceptTemplate.replace(
          "{}", encodeURIComponent(item.url));
        return {
          url: item.url,
          viewer
        };
      }),
      //
      isOpenData: dataset.type.includes(DATASET_TYPE_OPEN_DATA),
      isNonPublicData: dataset.type.includes(DATASET_TYPE_NON_PUBLIC_DATA),
    },
    // ...query,
    distributions: {
      visible: distributions.length > 0,
      pagination: {
        visible: data.distributions.length > query.distributionPageSize,
        total: data.distributions.length,
        pageSize: query.distributionPageSize,
        currentPage: query.distributionPage + 1,
        linkTemplate: navigation.linkFromServer({
          iri: query.iri,
          distributionPageSize: query.distributionPageSize,
          distributionPage: "_PAGE_"
        }).replace("_PAGE_", "{PAGE}") // We need '{PAGE}' in link template.
      },
      items: distributions
        .map(item => prepareDistribution(configuration.client, translation, item))
        .filter(item => item !== null),
    },
    applications: {
      visible: applications.items.length > 0,
      items: applications.items.map(item => ({
        title: item.title,
        description: item.description,
        href: applicationDetailNavigation.linkFromServer({ iri: item.iri }),
      })),
    },
    datasetSeries: {
      visible: series.items.length > 0,
      total: series.found,
      items: series.items.map(item => ({
        title: item.title,
        description: item.description,
        href: datasetDetailNavigation.linkFromServer({ iri: item.iri }),
      })),
      showAllHref: datasetListNavigation.linkFromServer({ isPartOf: dataset.iri })
    },
    metadataAsString: JSON.stringify({
      "@context": "http://schema.org/",
      "@type": "Dataset",
      name: dataset.title,
      description: dataset.description,
      url: dataset.iri,
      keywords: dataset.keywords,
      creator: {
        "@type": "Organization",
        url: dataset.publisher.url,
        name: dataset.publisher.label,
      },
      distribution: distributions
        .filter(isFileDistribution)
        .map(distribution => ({
          "@type": "DataDownload",
          contentUrl: distribution.downloadUrl,
          encodingFormat: distribution.format?.label,
        })),
    }),
  }
}

/**
 * Capture information required for rendering.
 */
export interface DatasetDetailTemplateModel {

  head: {
    matomoIsActive: boolean;
    matomoUrl: string;
    matomoSiteId: string;
  };

  navigation: {
    datasetsActive: boolean;
    applicationsActive: boolean;
    localCatalogsActive: boolean;
    suggestionsActive: boolean;
    publishersActive: boolean;
    cs: string;
    en: string;
  };

  footer: {
    applicationRegistrationFormUrl: string;
    suggestionRegistrationFormUrl: string;
    catalogValidator: string;
  };

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

}

interface HeadingViewModel {
  title: string;
  openUrl: string;
  editUrl: string | null;
  copyUrl: string | null;
  deleteDatasetUrl: string | null;
  deleteCatalogUrl: string | null;
}

interface ApplicableLegislationItem {
  url: string;
  label: string;
  /* When set render as a chip in the heading section. */
  chip: {
    variant: string;
    label: string;
  } | null;
}

interface HrefLabelIri {
  href: string;
  label: string;
  iri: string;
}

interface IriLabel {
  iri: string;
  label: string;
}

interface HrefLabel {
  href: string;
  label: string;
}

function asHrefLabel(value: { url: string, label: string | null }): HrefLabel {
  return {
    href: value.url,
    label: value.label ?? value.url,
  }
}

function asNullableHrefLabel(value: { url: string, label: string | null } | null): HrefLabel | null {
  if (value === null) {
    return null;
  }
  return asHrefLabel(value);
}

interface Distributions {
  visible: boolean;
  items: DistributionItem[];
  pagination: {
    visible: boolean;
    total: number;
    currentPage: number;
    pageSize: number;
    linkTemplate: string;
  };
}

interface DistributionItem {
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
  facilitatesSharing: FacilitatesSharingItem[];
  // Type specific.
  distribution: FileDistribution | null;
  dataService: DataService | null;
}

interface DcatApCzLegal {
  authorship: LicenseCondition;
  databaseAuthorship: LicenseCondition;
  protectedDatabaseAuthorship: LicenseCondition;
  personalData: IconLabelViewModel;
}

interface LicenseCondition {
  showQuality: boolean;
  href: string | null;
  label: string;
  icon: string;
  iconStyle: string;
  iconTitle: string;
  author: string | null;
}

interface IconLabelViewModel {
  label: string;
  icon: string;
  iconStyle: string;
  iconTitle: string;
}

interface FacilitatesSharingItem {

  sharedAs: HrefLabel | null;

  sharedBy: HrefLabel | null;

  obtainedBy: HrefLabel | null;

  correspondingTerm: string | null;

  correspondingTermViewer: string | null;

}

interface FileDistribution {
  downloadArray: string[];
  access: string | null;
  conformsTo: string[];
  mediaType: HrefLabel | null;
  compressFormat: HrefLabel | null;
  packageFormat: HrefLabel | null;
}

interface DataService {
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

function temporalAsString(
  { startDate, endDate, iri }: { startDate: Date, endDate: Date, iri: string },
) {

  const dataToString = (date: Date) => date.toISOString().split("T")[0];

  if (startDate === null) {
    if (endDate === null) {
      return iri;
    } else {
      return " - " + dataToString(endDate);
    }
  } else {
    if (endDate === null) {
      return dataToString(startDate) + " - ";
    } else {
      return dataToString(startDate) + " - " + dataToString(endDate);
    }
  }
}

function xsdDurationToString(translation: TranslationService, duration: string) {
  if (duration === null) {
    return null;
  }
  const { year, month, day, hour, minute, second, negative } = parseXsdDuration(duration);
  let result = "";
  let head = true;
  if (negative) {
    result = "-";
    head = false;
  }
  if (year !== null) {
    result += head ? "" : " ";
    result += translation.translate("year", year);
    head = false;
  }
  if (month !== null) {
    result += head ? "" : " ";
    result += translation.translate("month", month);
    head = false;
  }
  if (day !== null) {
    result += head ? "" : " ";
    result += translation.translate("day", day);
    head = false;
  }
  if (hour !== null) {
    result += head ? "" : " ";
    result += translation.translate("hour", hour);
    head = false;
  }
  if (minute !== null) {
    result += head ? "" : " ";
    result += translation.translate("minute", minute);
    head = false;
  }
  if (second !== null) {
    result += head ? "" : " ";
    result += translation.translate("second", second);
    head = false;
  }
  return result;
}

function parseXsdDuration(value: string) {
  // https://www.w3schools.com/xml/schema_dtypes_date.asp
  const result = {
    year: null,
    month: null,
    day: null,
    hour: null,
    minute: null,
    second: null,
    negative: value.startsWith("-"),
  };
  // Upper case and remove starting 'P'.
  value = value.toLocaleUpperCase();
  let readingTime = false;
  let buffer = "";
  for (let index = value.indexOf("P") + 1; index < value.length; ++index) {
    const next = value[index];
    if (next === "T") {
      readingTime = true;
    } else if (next === "Y") {
      result.year = parseInt(buffer);
      buffer = "";
    } else if (next === "M") {
      if (readingTime) {
        result.minute = parseInt(buffer);
      } else {
        result.month = parseInt(buffer);
      }
      buffer = "";
    } else if (next === "D") {
      result.day = parseInt(buffer);
      buffer = "";
    } else if (next === "H") {
      result.hour = parseInt(buffer);
      buffer = "";
    } else if (next === "S") {
      result.second = parseInt(buffer);
      buffer = "";
    } else {
      buffer += next;
    }
  }
  return result;
}

function prepareApplicableLegislation(applicableLegislation: { url: string }[]) {
  const result = applicableLegislation.map(({ url }) => ({
    url: url,
    label: url,
    chip: createChipForApplicableLegislation(url),
  }));
  result.sort((left, right) => {
    if (left.chip !== null && right.chip === null) {
      return -1;
    }
    if (left.chip === null && right.chip !== null) {
      return 1;
    }
    return left.url.localeCompare(right.url, 'en');
  });
  return result;
}

// TODO Export to vocabulary file !

const LEGISLATION_HVD = "http://data.europa.eu/eli/reg_impl/2023/138/oj";

const LEGISLATION_DYNAMIC_DATA = "https://www.e-sbirka.cz/eli/cz/sb/1999/106/2024-01-01/dokument/norma/cast_1/par_3a/odst_6";

const DATASET_TYPE_OPEN_DATA = "https://data.dia.gov.cz/zdroj/číselníky/typ-datové-sady/položky/otevřená-data";

const DATASET_TYPE_NON_PUBLIC_DATA = "https://data.dia.gov.cz/zdroj/číselníky/typ-datové-sady/položky/neveřejná-data";

function createChipForApplicableLegislation(url: string) {
  switch (url) {
    case LEGISLATION_HVD:
      return {
        variant: "error",
        label: "HVD",
      };
    case LEGISLATION_DYNAMIC_DATA:
      return {
        variant: "warning",
        label: "Dynamická",
      };
    default:
      return null;
  }
}

const SPARQL_SCHEMA = "https://www.w3.org/TR/sparql11-protocol/";

function prepareDistribution(
  configuration: {
    sparqlEditorUrl: string | null,
    sparqlDefaultQuery: string | null,
    sparqlClassAndPropertiesTemplate: string | null,
  },
  translation: TranslationService,
  value: Distributable,
): DistributionItem | null {
  if (isFileDistribution(value)) {
    const showSharingSpecifications =
      value.sharedInterfaceAccessType.length > 0 ||
      value.sharedInterfaceContentType.length > 0 ||
      value.sharedInterfaceKind.length > 0;
    return {
      ...(showSharingSpecifications ? {
        sizeMd: "12/12", sizeLg: "6/12"
      } : {
        sizeMd: "6/12", sizeLg: "4/12"
      }),
      iri: value.iri,
      title: value.title,
      format: value.format?.label ?? null,
      applicableLegislation: value.applicableLegislation.map(item => ({
        chip: null,
        label: item.url,
        url: item.url,
      })),
      missingLegal: value.termsOfUse === null,
      dcatApLegal: value.termsOfUse?.type === "DcatAp",
      dcatApCzLegal: prepareDcatApCzTermsOfUse(translation, value),
      showSharingSpecifications,
      sharedInterfaceAccessType: value.sharedInterfaceAccessType
        .map(item => ({ href: item.url, label: item.label })),
      sharedInterfaceContentType: value.sharedInterfaceContentType
        .map(item => ({ href: item.url, label: item.label })),
      sharedInterfaceKind: value.sharedInterfaceKind
        .map(item => ({ href: item.url, label: item.label })),
      facilitatesSharingCount: value.facilitatesSharing.length,
      facilitatesSharing: value.facilitatesSharing
        .map(prepareFacilitatesSharing),
      //
      distribution: {
        mediaType: firstAsHrefLabel(value.mediaType),
        compressFormat: firstAsHrefLabel(value.compressFormat),
        packageFormat: firstAsHrefLabel(value.packageFormat),
        conformsTo: value.conformsTo,
        downloadArray: value.downloadUrl === null ? [] : [value.downloadUrl],
        // We render access URL only when is is not part of download.
        access: value.downloadUrl === value.accessUrl ? null : value.accessUrl,
      },
      dataService: null,
    };
  }
  else if (isDataService(value)) {
    const sparqlCompliant = value.conformsTo.includes(SPARQL_SCHEMA);
    const showSparqlEditor = sparqlCompliant && value.endpointUrl && configuration.sparqlEditorUrl;
    const showSharingSpecifications =
      value.sharedInterfaceAccessType.length > 0 ||
      value.sharedInterfaceContentType.length > 0 ||
      value.sharedInterfaceKind.length > 0;
    return {
      ...(showSharingSpecifications ? {
        sizeMd: "12/12", sizeLg: "6/12"
      } : {
        sizeMd: "6/12", sizeLg: "4/12"
      }),
      iri: value.iri,
      title: value.title,
      format: value.format?.label ?? null,
      applicableLegislation: value.applicableLegislation.map(item => ({
        chip: null,
        label: item.url,
        url: item.url,
      })),
      missingLegal: value.termsOfUse === null,
      dcatApLegal: value.termsOfUse.type === "DcatAp",
      dcatApCzLegal: prepareDcatApCzTermsOfUse(translation, value),
      showSharingSpecifications,
      sharedInterfaceAccessType: value.sharedInterfaceAccessType
        .map(item => ({ href: item.url, label: item.label })),
      sharedInterfaceContentType: value.sharedInterfaceContentType
        .map(item => ({ href: item.url, label: item.label })),
      sharedInterfaceKind: value.sharedInterfaceKind
        .map(item => ({ href: item.url, label: item.label })),
      facilitatesSharingCount: value.facilitatesSharing.length,
      facilitatesSharing: value.facilitatesSharing
        .map(prepareFacilitatesSharing),
      //
      distribution: null,
      dataService: {
        conformsTo: value.conformsTo,
        iri: value.iri,
        endpointDescription: value.endpointDescription,
        endpointUrl: value.endpointUrl,
        access: value.endpointUrl === value.accessUrl ? null : value.accessUrl,
        sparqlEditor: showSparqlEditor
          ? `${configuration.sparqlEditorUrl}#query=${configuration.sparqlDefaultQuery}&endpoint=${value.endpointUrl}`
          : null,
        classesAndProperties: showSparqlEditor && configuration.sparqlClassAndPropertiesTemplate
          ? configuration.sparqlClassAndPropertiesTemplate.replace("{}", encodeURIComponent(value.endpointUrl))
          : null,
        documentation: value.documentation,
        contact: value.contact.map(item => ({
          label: item.label ?? item.email,
          href: "mailto:" + item.email,
        })),
      },
    };
  }
  else {
    return null;
  }
}

function prepareFacilitatesSharing(
  item: FacilitatesSharing,
): FacilitatesSharingItem {
  const viewer = configuration.client.conceptTemplate.replace(
    "{}", encodeURIComponent(item.correspondingTerm.url));
  return {
    correspondingTermViewer: item.correspondingTerm.url === null ? null : viewer,
    correspondingTerm: item.correspondingTerm.url,
    obtainedBy: asNullableHrefLabel(item.obtainedBy),
    sharedAs: asNullableHrefLabel(item.sharedAs),
    sharedBy: asNullableHrefLabel(item.sharedBy),
  }
}

function firstAsHrefLabel(
  items: { url: string, label: string | null }[],
): HrefLabel | null {
  if (items.length === 0) {
    return null;
  }
  return asHrefLabel(items[0]);
}

const AUTHORSHIP_MAP = {
  "https://data.gov.cz/podmínky-užití/neobsahuje-autorská-díla/": (): LicenseCondition => ({
    label: "without-authorship",
    icon: "check-lg",
    iconStyle: "alright",
    iconTitle: "without-authorship-comment",
    author: null,
    href: null,
    showQuality: false,
  }),
  "https://data.gov.cz/podmínky-užití/obsahuje-více-autorských-děl/": (): LicenseCondition => ({
    label: "with-multiple-authorship",
    icon: "list",
    iconStyle: "warning",
    iconTitle: "with-authorship-comment",
    author: null,
    href: null,
    showQuality: false,
  }),
  "https://creativecommons.org/licenses/by/4.0/": (author: string): LicenseCondition => ({
    label: "ccby-authorship",
    icon: "bookmark-fill",
    iconStyle: "warning",
    iconTitle: "ccby-authorship-comment",
    author,
    href: null,
    showQuality: false,
  }),
  null: (): LicenseCondition => ({
    label: "missing-authorship",
    icon: "exclamation-circle",
    iconStyle: "danger",
    iconTitle: "missing-authorship-comment",
    author: null,
    href: null,
    showQuality: false,
  }),
}

const AUTHORSHIP_CUSTOM = (authorship): LicenseCondition => ({
  label: "custom-authorship",
  icon: "question-circle",
  iconStyle: "warning",
  iconTitle: "custom-authorship-comment",
  href: authorship,
  showQuality: true,
  author: null,
});

const DATABASE_AUTHORSHIP_MAP = {
  "https://data.gov.cz/podmínky-užití/není-autorskoprávně-chráněnou-databází/": (): LicenseCondition => ({
    label: "without-database-authorship",
    icon: "check-lg",
    iconStyle: "alright",
    iconTitle: "without-database-authorship-comment",
    author: null,
    href: null,
    showQuality: false,
  }),
  "https://creativecommons.org/licenses/by/4.0/": (author: string): LicenseCondition => ({
    label: "ccby-database-authorship",
    icon: "bookmark-fill",
    iconStyle: "warning",
    iconTitle: "ccby-database-authorship-comment",
    author,
    href: null,
    showQuality: false,
  }),
  null: (): LicenseCondition => ({
    label: "missing-database-authorship",
    icon: "exclamation-circle",
    iconStyle: "danger",
    iconTitle: "missing-database-authorship-comment",
    author: null,
    href: null,
    showQuality: false,
  }),
}

const DATABASE_AUTHORSHIP_CUSTOM = (authorship): LicenseCondition => ({
  label: "custom-database-authorship",
  icon: "question-circle",
  iconStyle: "warning",
  iconTitle: "custom-database-authorship-comment",
  href: authorship,
  showQuality: true,
  author: null,
});

const PROTECTED_DATABASE_AUTHORSHIP_MAP = {
  "https://data.gov.cz/podmínky-užití/není-chráněna-zvláštním-právem-pořizovatele-databáze/": (): LicenseCondition => ({
    label: "without-protected-database-authorship",
    icon: "check-lg",
    iconStyle: "alright",
    iconTitle: "without-protected-database-authorship-comment",
    author: null,
    href: null,
    showQuality: false,
  }),
  "https://creativecommons.org/publicdomain/zero/1.0/": (): LicenseCondition => ({
    label: "cc0-protected-database-authorship",
    icon: "check-lg",
    iconStyle: "alright",
    iconTitle: "cc0-protected-database-authorship-comment",
    author: null,
    href: null,
    showQuality: false,
  }),
  "https://creativecommons.org/licenses/by/4.0/": (): LicenseCondition => ({
    label: "ccby-database-authorship",
    icon: "bookmark-fill",
    iconStyle: "warning",
    iconTitle: "ccby-database-authorship-comment",
    author: null,
    href: null,
    showQuality: false,
  }),
  null: (): LicenseCondition => ({
    label: "missing-protected-database-authorship",
    icon: "exclamation-circle",
    iconStyle: "danger",
    iconTitle: "missing-protected-database-authorship-comment",
    author: null,
    href: null,
    showQuality: false,
  }),
}

const PROTECTED_DATABASE_AUTHORSHIP_CUSTOM = (authorship): LicenseCondition => ({
  label: "custom-protected-database",
  icon: "question-circle",
  iconStyle: "warning",
  iconTitle: "custom-protected-database-comment",
  href: authorship,
  showQuality: true,
  author: null,
});

const PERSONAL_DATA_MAP = {
  "https://data.gov.cz/podmínky-užití/obsahuje-osobní-údaje/": (): LicenseCondition => ({
    label: "with-personal-data-label",
    icon: "person-fill",
    iconStyle: "warning",
    iconTitle: "with-personal-data-comment",
    author: null,
    href: null,
    showQuality: false,
  }),
  "https://data.gov.cz/podmínky-užití/neobsahuje-osobní-údaje/": (): LicenseCondition => ({
    label: "without-personal-data-label",
    icon: "person-fill",
    iconStyle: "alright",
    iconTitle: "without-personal-data-comment",
    author: null,
    href: null,
    showQuality: false,
  }),
  "https://data.gov.cz/podmínky-užití/není-specifikováno-zda-obsahuje-osobní-údaje/": (): LicenseCondition => ({
    label: "unspecified-personal-data-label",
    icon: "person-fill",
    iconStyle: "warning",
    iconTitle: "unspecified-personal-data-comment",
    author: null,
    href: null,
    showQuality: false,
  }),
  null: (): LicenseCondition => ({
    label: "missing-personal-data-information-label",
    icon: "person-fill",
    iconStyle: "danger",
    iconTitle: "missing-personal-data-information-comment",
    author: null,
    href: null,
    showQuality: false,
  }),
}

function prepareDcatApCzTermsOfUse(
  translation: TranslationService, distribution: Distributable,
): DcatApCzLegal | null {

  if (distribution.termsOfUse?.type !== "DcatApCz") {
    return null;
  }
  const value = distribution.termsOfUse;

  // Authorship can have a custom value.
  const authorship = AUTHORSHIP_MAP[value.authorship]?.(value.author)
    ?? AUTHORSHIP_CUSTOM(value.authorship);
  if (authorship !== null) {
    authorship.label = translation.translate(authorship.label);
    authorship.iconTitle = translation.translate(authorship.iconTitle);
  }

  // Database authorship can have a custom value.
  const databaseAuthorship = DATABASE_AUTHORSHIP_MAP[value.databaseAuthorship]?.(value.databaseAuthor)
    ?? DATABASE_AUTHORSHIP_CUSTOM(value.databaseAuthorship);
  if (databaseAuthorship !== null) {
    databaseAuthorship.label = translation.translate(databaseAuthorship.label);
    databaseAuthorship.iconTitle = translation.translate(databaseAuthorship.iconTitle);
  }

  // Protected database authorship can have a custom value.
  const protectedDatabaseAuthorship = PROTECTED_DATABASE_AUTHORSHIP_MAP[value.protectedDatabaseAuthorship]?.()
    ?? PROTECTED_DATABASE_AUTHORSHIP_CUSTOM(value.protectedDatabaseAuthorship);
  if (protectedDatabaseAuthorship !== null) {
    protectedDatabaseAuthorship.label = translation.translate(protectedDatabaseAuthorship.label);
    protectedDatabaseAuthorship.iconTitle = translation.translate(protectedDatabaseAuthorship.iconTitle);
  }

  // Information about personal information can be missing.
  const personalData = PERSONAL_DATA_MAP[value.containsPersonalData]?.() ?? null;
  if (personalData !== null) {
    personalData.label = translation.translate(personalData.label);
    personalData.iconTitle = translation.translate(personalData.iconTitle);
  }

  return {
    authorship,
    databaseAuthorship,
    protectedDatabaseAuthorship,
    personalData
  };
}
