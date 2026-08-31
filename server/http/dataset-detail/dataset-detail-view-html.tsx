import { FastifyReply } from "fastify";
import {
  DatasetDetailViewModel,
  Distributable,
  isDataService,
  isFileDistribution,
  FacilitatesSharing,
} from "./dataset-detail-model.ts";
import {
  createHeadData,
} from "../../component/index.mjs";
import { Head, type HeadData } from "../../component/head.tsx";
import type { Configuration } from "../../configuration.ts";
import { NavigationEntry } from "../../service/navigation-service.ts";
import { LinkService } from "../../service/link-service.ts";
import {
  TranslationDictionary,
  TranslationService,
} from "../../service/translation-service.ts";
import { NKOD } from "../../data-source/shared/vocabulary.ts";
import { ROUTE } from "../route-name.mjs";
import { headerHtml } from "../../component/header.ts";
import { footerHtml } from "../../component/footer.ts";
import { renderToHtml } from "../../html/render-html.ts";
import { breakLines, escapeExpression } from "../../html/escape.ts";
import { capture } from "../../capture/capture-manager.ts";

type Language = "cs" | "en";

export function renderHtml(
  services: {
    http: any,
    configuration: Configuration,
    navigation: NavigationEntry,
    translation: TranslationService,
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

  const state = prepareTemplateData(
    services.configuration, services.translation, services.navigation,
    services.link, languages, data, query);

  const html = renderDatasetDetailHtml(state, languages[0]);
  capture.captureViewRender(ROUTE.DATASET_DETAIL, state, html);

  reply
    .code(200)
    .header("Content-Type", "text/html; charset=utf-8")
    .send(html);

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
    translation: translation.dictionary,
    labelEndpoint: configuration.client.conceptSparql,
    headerHtml: headerHtml(navigation, languages[0], query),
    footerHtml: footerHtml(languages[0]),
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

  head: HeadData;

  translation: TranslationDictionary;

  headerHtml: string;

  footerHtml: string;

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
  /** `{{t "facilitates-sharing" count}}`, resolved in the mapper. */
  facilitatesSharingText: string;
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
    conceptTemplate: string,
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
      facilitatesSharingText: translation.translate("facilitates-sharing", value.facilitatesSharing.length),
      facilitatesSharing: value.facilitatesSharing
        .map((item) => prepareFacilitatesSharing(item, configuration.conceptTemplate)),
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
      facilitatesSharingText: translation.translate("facilitates-sharing", value.facilitatesSharing.length),
      facilitatesSharing: value.facilitatesSharing
        .map((item) => prepareFacilitatesSharing(item, configuration.conceptTemplate)),
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
  conceptTemplate: string,
): FacilitatesSharingItem {
  const viewer = conceptTemplate.replace(
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

// -- View -----------------------------------------------------------------

type Dict = TranslationDictionary;

export function renderDatasetDetailHtml(
  state: DatasetDetailTemplateModel,
  language: "cs" | "en",
): string {
  const t = state.translation;
  const head = renderToHtml(<DatasetDetailHead state={state} />);
  const datasetSection = renderToHtml(<DatasetSection state={state} />);
  const distributionsSection = state.distributions.visible
    ? renderToHtml(<DistributionsSection state={state} />)
    : "";
  const seriesSection = state.datasetSeries.visible
    ? renderToHtml(<SeriesSection state={state} />)
    : "";
  const applicationsSection = state.applications.visible
    ? renderToHtml(<ApplicationsSection state={state} />)
    : "";
  return (
    "<!DOCTYPE html>\n" +
    `<html dir="ltr" lang="${language}">\n` +
    `<head>\n${head}\n</head>\n` +
    `<body class="dataset-detail" data-sparql-endpoint="${escapeExpression(state.labelEndpoint)}">\n` +
    `${state.headerHtml}\n` +
    `${datasetSection}\n${distributionsSection}\n${seriesSection}\n${applicationsSection}\n` +
    `${state.footerHtml}\n` +
    `<script type="application/ld+json">${state.metadataAsString}</script>\n` +
    `<gov-modal id="legislation-list-modal" label="${escapeExpression(t["modal-legislation"])}"></gov-modal>\n` +
    `<gov-modal id="facilitates-sharing-modal" label="${escapeExpression(t["modal-facilitates-sharing"])}"></gov-modal>\n` +
    "</body>\n</html>\n"
  );
}

function DatasetDetailHead({ state }: { state: DatasetDetailTemplateModel }) {
  const t = state.translation;
  return (
    <>
      <Head state={state.head} />
      <title>
        {state.dataset.heading.title} - {t["title-suffix"]}
      </title>
      <meta name="description" content={t["page-description"]} />
      <link rel="canonical" href="/dataset" />
      <link rel="alternate" href="/datová-sada" hreflang="cs" />
      <link rel="alternate" href="/dataset" hreflang="en" />
      <link
        type="text/css"
        rel="stylesheet"
        href="/assets/catalog/css/dataset-detail.css"
      />
      <link
        type="text/css"
        rel="stylesheet"
        href="/assets/catalog/css/resource-detail.css"
      />
      <script src="/assets/catalog/js/dataset-detail.js"></script>
    </>
  );
}

function Dl({ term, children }: { term: string; children: any }) {
  return (
    <dl>
      <dt>{term}</dt>
      {children}
    </dl>
  );
}

function Chip({ chip }: { chip: { variant: string; label: string } | null }) {
  if (!chip) {
    return null;
  }
  return (
    <gov-chip variant={chip.variant} type="outlined" size="s">
      {chip.label}
    </gov-chip>
  );
}

function LegislationChip({
  items,
  wrapInHiddenDiv,
}: {
  items: ApplicableLegislationItem[];
  wrapInHiddenDiv: boolean;
}) {
  if (items.length === 0) {
    return null;
  }
  const list = (
    <ul>
      {items.map((item) => (
        <li>
          <Chip chip={item.chip} />
          <a href={item.url} rel="nofollow noopener noreferrer" target="_blank">
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  );
  return (
    <gov-chip
      variant="primary"
      type="outlined"
      size="s"
      class="legislation-list"
      tag="button"
    >
      {" "}
      §{" "}
      {wrapInHiddenDiv ? <div style="display: none;">{list}</div> : list}
    </gov-chip>
  );
}

function CodelistDd({
  item,
  goToLink,
}: {
  item: HrefLabelIri;
  goToLink: string;
}) {
  return (
    <dd>
      <a href={item.href ?? ""}>
        {" "}
        {item.label}{" "}
      </a>
      <a
        href={item.iri ?? ""}
        title={goToLink}
        rel="nofollow noopener noreferrer"
        target="_blank"
      >
        <gov-icon name="box-arrow-up-right"></gov-icon>
      </a>
    </dd>
  );
}

function DatasetSection({ state }: { state: DatasetDetailTemplateModel }) {
  const t = state.translation;
  const d = state.dataset;
  const h = d.heading;
  return (
    <gov-container class="dataset-container" data-iri={d.iri}>
      <div>
        <h1 class="inline">{h.title}</h1>
        <span class="x-large">
          <a href={h.openUrl ?? ""}>
            <gov-icon
              name="box-arrow-up-right"
              title={t["open-link-title"]}
            ></gov-icon>
          </a>
          {h.editUrl ? (
            <a href={h.editUrl}>
              <gov-icon
                name="pencil"
                type="bootstrap"
                title={t["edit-dataset-title"]}
              ></gov-icon>
            </a>
          ) : null}
          {h.copyUrl ? (
            <a href={h.copyUrl}>
              <gov-icon name="copy" title={t["copy-dataset-title"]}></gov-icon>
            </a>
          ) : null}
          {h.deleteDatasetUrl ? (
            <a href={h.deleteDatasetUrl}>
              <gov-icon
                name="trash"
                title={t["delete-dataset-title"]}
              ></gov-icon>
            </a>
          ) : null}
          {h.deleteCatalogUrl ? (
            <a href={h.deleteCatalogUrl}>
              <gov-icon
                name="trash"
                title={t["delete-catalog-title"]}
              ></gov-icon>
            </a>
          ) : null}
        </span>
        {d.publisher ? (
          <a href={d.publisher.href}>
            <h2>{d.publisher.label}</h2>
          </a>
        ) : null}
      </div>
      <div class="applicable-legislation chip-container mb-2">
        {d.isOpenData ? (
          <gov-chip variant="success" type="outlined" size="xs">
            {" "}
            {t["open-data"]}{" "}
          </gov-chip>
        ) : null}
        {d.isNonPublicData ? (
          <gov-chip variant="warning" type="outlined" size="xs">
            {" "}
            {t["non-public-data"]}{" "}
          </gov-chip>
        ) : null}
        {d.applicableLegislation.map((item) => (
          <Chip chip={item.chip} />
        ))}
        <LegislationChip items={d.applicableLegislation} wrapInHiddenDiv={true} />
      </div>
      <div class="chip-container mb-2">
        {d.keywords.map((keyword) => (
          <gov-chip
            variant="primary"
            type="outlined"
            size="s"
            href={keyword.href}
          >
            {" "}
            {keyword.label}{" "}
          </gov-chip>
        ))}
      </div>
      <p
        dangerouslySetInnerHTML={{
          __html: " " + breakLines(d.description) + " ",
        }}
      ></p>
      <gov-grid>
        <gov-grid-item size-sm="6/12" size-md="3/12">
          {d.themesVisible ? (
            <Dl term={t["dt-theme"]}>
              {d.themes.map((item) => (
                <CodelistDd item={item} goToLink={t["go-to-link"]} />
              ))}
            </Dl>
          ) : null}
          {d.euroVocThemesVisible ? (
            <Dl term={t["dt-eurovoc"]}>
              {d.euroVocThemes.map((item) => (
                <CodelistDd item={item} goToLink={t["go-to-link"]} />
              ))}
            </Dl>
          ) : null}
        </gov-grid-item>
        <gov-grid-item size-sm="6/12" size-md="3/12">
          {d.spatialVisible ? (
            <Dl term={t["dt-spatial"]}>
              {d.spatial.map((item) => (
                <dd>
                  {" "}
                  {item.label}{" "}
                  <a
                    href={item.iri ?? ""}
                    title={t["go-to-link"]}
                    rel="nofollow noopener noreferrer"
                    target="_blank"
                  >
                    <gov-icon name="box-arrow-up-right"></gov-icon>
                  </a>
                </dd>
              ))}
            </Dl>
          ) : null}
          {d.spatialResolutionInMetersVisible ? (
            <Dl term={t["dt-spatial-resolution"]}>
              <dd>
                {" "}
                {d.spatialResolutionInMeters}{" "}
              </dd>
            </Dl>
          ) : null}
          {d.temporalVisible ? (
            <Dl term={t["dt-temporal"]}>
              <dd>
                {" "}
                {d.temporal}{" "}
              </dd>
            </Dl>
          ) : null}
          {d.temporalResolutionVisible ? (
            <Dl term={t["dt-temporal-resolution"]}>
              <dd>
                {" "}
                {d.temporalResolution}{" "}
              </dd>
            </Dl>
          ) : null}
        </gov-grid-item>
        <gov-grid-item size-sm="6/12" size-md="3/12">
          {d.documentation.length > 0 ? (
            <Dl term={t["dt-documentation"]}>
              {d.documentation.map((url) => (
                <dd class="documentation">
                  <a href={url}>{t["show-documentation"]}</a>
                  <span class="quality"></span>
                </dd>
              ))}
            </Dl>
          ) : null}
          {d.contactVisible ? (
            <Dl term={t["dt-contact"]}>
              {d.contact.map((item) => (
                <dd>
                  <a href={item.href}>{item.label}</a>
                </dd>
              ))}
            </Dl>
          ) : null}
          {d.conformsToVisible ? (
            <Dl term={t["dt-specification"]}>
              {d.conformsTo.map((item) => (
                <dd class="specification">
                  <a href={item.href}>{item.label}</a>
                  <span class="quality"></span>
                </dd>
              ))}
            </Dl>
          ) : null}
        </gov-grid-item>
        <gov-grid-item size-sm="6/12" size-md="3/12">
          {d.frequencyVisible && d.frequency ? (
            <Dl term={t["dt-frequency"]}>
              <dd>
                {" "}
                {d.frequency.label}{" "}
                <a
                  href={d.frequency.iri ?? ""}
                  title={t["go-to-link"]}
                  rel="nofollow noopener noreferrer"
                  target="_blank"
                >
                  <gov-icon name="box-arrow-up-right"></gov-icon>
                </a>
              </dd>
            </Dl>
          ) : null}
          {d.hvdCategoryVisible ? (
            <Dl term={t["dt-hvd-category"]}>
              {d.hvdCategory.map((item) => (
                <CodelistDd item={item} goToLink={t["go-to-link"]} />
              ))}
            </Dl>
          ) : null}
          {d.landingPage ? (
            <Dl term={t["dt-landing-page"]}>
              <dd>
                <a href={d.landingPage}>
                  {" "}
                  {t["show-landing-page"]}{" "}
                </a>
              </dd>
            </Dl>
          ) : null}
          {d.publicInformationSystem.length > 0 ? (
            <Dl term="ISVS">
              {d.publicInformationSystem.map((item) => (
                <dd>
                  <a href={item.href}>{item.label}</a>
                </dd>
              ))}
            </Dl>
          ) : null}
          {d.concernTerm.length > 0 ? (
            <Dl term={t["dt-concepts"]}>
              {d.concernTerm.map((item) => (
                <dd>
                  <a href={item.viewer}>
                    <span data-label="http://www.w3.org/2004/02/skos/core#prefLabel">
                      {item.url}
                    </span>
                  </a>
                  <a href={item.url}>
                    <gov-icon
                      name="box-arrow-up-right"
                      title={t["concept-link-title"]}
                    ></gov-icon>
                  </a>
                </dd>
              ))}
            </Dl>
          ) : null}
        </gov-grid-item>
      </gov-grid>
      {d.parentDataset ? (
        <p>
          {" "}
          {t["part-of-series"]}{" "}
          <a href={d.parentDataset.href} title={t["series-link-title"]}>
            {d.parentDataset.label}
          </a>
          .{" "}
        </p>
      ) : null}
      <br />
    </gov-container>
  );
}

function DistributionsSection({
  state,
}: {
  state: DatasetDetailTemplateModel;
}) {
  const t = state.translation;
  const { items, pagination } = state.distributions;
  return (
    <gov-container class="distribution-container">
      <h2>{t["h2-distributions"]}</h2>
      <br />
      <gov-grid>
        {items.map((item) => (
          <DistributionCard item={item} t={t} />
        ))}
      </gov-grid>
      {pagination.visible ? (
        <gov-grid-item size-sm="12/12" size-md="10/12">
          <gov-pagination
            total={String(pagination.total)}
            current={String(pagination.currentPage)}
            page-size={String(pagination.pageSize)}
            wcag-label={t["pagination-label"]}
            wcag-select-label={t["pagination-select-label"]}
            link={pagination.linkTemplate}
          ></gov-pagination>
        </gov-grid-item>
      ) : null}
    </gov-container>
  );
}

function DistributionCard({
  item,
  t,
}: {
  item: DistributionItem;
  t: Dict;
}) {
  return (
    <gov-grid-item
      size-sm="12/12"
      size-md={item.sizeMd}
      size-lg={item.sizeLg}
    >
      <div class="distribution-item-wrap m-1 p-2" data-iri={item.iri}>
        <h3 class="gov-text--xl">{item.title}</h3>
        <h4 class="gov-text--xl gov-color--secondary-700 break-word-wrap">
          {item.format}
        </h4>
        {item.applicableLegislation.length > 0 ? (
          <div class="applicable-legislation chip-container mb-2">
            {item.applicableLegislation.map((legislation) => (
              <Chip chip={legislation.chip} />
            ))}
            <LegislationChip
              items={item.applicableLegislation}
              wrapInHiddenDiv={false}
            />
          </div>
        ) : null}
        <div class="flex-row">
          {item.missingLegal ? (
            <div class="distribution-item-wrap-column">
              <div>
                <h5 class="gov-text--l gov-color--secondary-700">
                  {t["terms-unspecified"]}
                </h5>
              </div>
            </div>
          ) : null}
          {item.dcatApLegal ? (
            <div class="distribution-item-wrap-column">
              <div>
                <a href="" rel="nofollow noopener noreferrer" target="_blank">
                  {t["terms-of-use-link"]}
                </a>
              </div>
            </div>
          ) : null}
          {item.dcatApCzLegal ? (
            <DcatApCzColumn legal={item.dcatApCzLegal} t={t} />
          ) : null}
          {item.distribution ? (
            <FileDistributionColumn distribution={item.distribution} t={t} />
          ) : null}
          {item.dataService ? (
            <DataServiceColumn service={item.dataService} t={t} />
          ) : null}
          {item.showSharingSpecifications ? (
            <SharingSpecColumn item={item} t={t} />
          ) : null}
        </div>
      </div>
    </gov-grid-item>
  );
}

function LicenseConditionLi({
  className,
  condition,
  fallback,
}: {
  className: string;
  condition: LicenseCondition;
  fallback: string;
}) {
  return (
    <li class={className}>
      {condition.showQuality ? <span class="quality"></span> : null}
      <div>
        {condition.href ? (
          <a
            href={condition.href}
            rel="nofollow noopener noreferrer"
            target="_blank"
          >
            {condition.label}
          </a>
        ) : (
          <>
            {" "}
            {condition.label}{" "}
          </>
        )}
        <gov-icon
          name={condition.icon}
          class={condition.iconStyle}
          title={condition.iconTitle}
          type="bootstrap"
        ></gov-icon>
      </div>
      {condition.author ? (
        <>
          {" "}
          {condition.author}{" "}
        </>
      ) : (
        <>
          {" "}
          {fallback}{" "}
        </>
      )}
    </li>
  );
}

function DcatApCzColumn({
  legal,
  t,
}: {
  legal: DcatApCzLegal;
  t: Dict;
}) {
  const pd = legal.personalData as unknown as LicenseCondition | null;
  return (
    <div class="distribution-item-wrap-column">
      <div>
        <h5 class="gov-text--l gov-color--secondary-700">{t["terms-of-use"]}</h5>
      </div>
      <ul>
        <LicenseConditionLi
          className="authorship"
          condition={legal.authorship}
          fallback={t["copyrighted-work"]}
        />
        <LicenseConditionLi
          className="databaseAuthorship"
          condition={legal.databaseAuthorship}
          fallback={t["copyrighted-database"]}
        />
        <LicenseConditionLi
          className="protectedDatabaseAuthorship"
          condition={legal.protectedDatabaseAuthorship}
          fallback={t["sui-generis"]}
        />
        <li>
          {pd ? (
            <div>
              {" "}
              {pd.label}{" "}
              <gov-icon
                name={pd.icon}
                class={pd.iconStyle}
                title={pd.iconTitle}
                type="bootstrap"
              ></gov-icon>
            </div>
          ) : null}
          {" "}
          {t["personal-data"]}{" "}
        </li>
      </ul>
    </div>
  );
}

function FileDistributionColumn({
  distribution,
  t,
}: {
  distribution: FileDistribution;
  t: Dict;
}) {
  return (
    <div class="distribution-item-wrap-column">
      <div>
        <h5 class="gov-text--l gov-color--secondary-700">
          {t["h5-downloadable-file"]}
        </h5>
      </div>
      <ul>
        {distribution.downloadArray.length > 0 ? (
          <li>
            {distribution.downloadArray.map((url) => (
              <div class="download">
                <a href={url}>{t["download"]}</a>
                <span class="quality"></span>
              </div>
            ))}
            {distribution.access ? (
              <div class="access">
                <a href={distribution.access}>{t["access-information"]}</a>
                <span class="quality"></span>
              </div>
            ) : null}
          </li>
        ) : null}
        {distribution.conformsTo.length > 0 ? (
          <li class="schema">
            {distribution.conformsTo.map((url) => (
              <>
                <a href={url}>{t["schema"]}</a>
                <span class="quality"></span>
              </>
            ))}
          </li>
        ) : null}
        {distribution.mediaType ? (
          <li>
            <div class="mediaType break-word-wrap">
              {" "}
              {distribution.mediaType.label}{" "}
              <a href={distribution.mediaType.href}>
                <gov-icon name="box-arrow-up-right"></gov-icon>
              </a>
              <span class="quality"></span>
            </div>
            {" "}
            {t["media-type"]}{" "}
          </li>
        ) : null}
        {distribution.compressFormat ? (
          <li>
            <div>
              {" "}
              {distribution.compressFormat.label}{" "}
              <a href={distribution.compressFormat.href}>
                <gov-icon name="box-arrow-up-right"></gov-icon>
              </a>
            </div>
            {" "}
            {t["compress-format"]}{" "}
          </li>
        ) : null}
        {distribution.packageFormat ? (
          <li>
            <div>
              {" "}
              {distribution.packageFormat.label}{" "}
              <a href={distribution.packageFormat.href}>
                <gov-icon name="box-arrow-up-right"></gov-icon>
              </a>
            </div>
            {" "}
            {t["package-format"]}{" "}
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function DataServiceColumn({
  service,
  t,
}: {
  service: DataService;
  t: Dict;
}) {
  return (
    <div
      class="distribution-item-wrap-column data-service"
      data-iri={service.iri}
    >
      <div>
        <h5 class="gov-text--l gov-color--secondary-700">
          {" "}
          {t["h5-data-service"]}{" "}
        </h5>
      </div>
      <ul>
        <li>
          <div class="endpointDescription">
            <a href={service.endpointDescription}>{t["endpoint-description"]}</a>
            <span class="quality"></span>
          </div>
          {service.access ? (
            <div class="access">
              <a href={service.access}>{t["access-information"]}</a>
              <span class="quality"></span>
            </div>
          ) : null}
        </li>
        <li>
          <div class="endpointUrl">
            <a href={service.endpointUrl}>Endpoint</a>
            <span class="quality"></span>
          </div>
          {service.sparqlEditor ? (
            <div>
              <a href={service.sparqlEditor}>{t["sparql-query"]}</a>
            </div>
          ) : null}
          {service.classesAndProperties ? (
            <div>
              <a href={service.classesAndProperties}>
                {t["classes-and-properties"]}
              </a>
            </div>
          ) : null}
        </li>
        {service.conformsTo.length > 0 ? (
          <li class="schema">
            {service.conformsTo.map((url) => (
              <>
                <a href={url}>Standard</a>
                <span class="quality"></span>
              </>
            ))}
          </li>
        ) : null}
        {service.contact.length > 0 ? (
          <li>
            <div>
              {service.contact.map((contact) => (
                <a href={contact.href}>{contact.label}</a>
              ))}
            </div>
            {" "}
            {t["label-contact"]}{" "}
          </li>
        ) : null}
        {service.documentation.length > 0 ? (
          <li>
            {service.documentation.map((url) => (
              <a href={url}>{t["show-documentation"]}</a>
            ))}
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function SharingSpecColumn({
  item,
  t,
}: {
  item: DistributionItem;
  t: Dict;
}) {
  return (
    <div class="distribution-item-wrap-column share-specification">
      <div>
        <h5 class="gov-text--l gov-color--secondary-700">
          {t["h5-sharing-specification"]}
        </h5>
      </div>
      <ul>
        {item.sharedInterfaceContentType.length > 0 ? (
          <li>
            <ul>
              {item.sharedInterfaceContentType.map((entry) => (
                <li>{entry.label}</li>
              ))}
            </ul>
            {" "}
            {t["shared-content-type"]}{" "}
          </li>
        ) : null}
        {item.sharedInterfaceAccessType.length > 0 ? (
          <li>
            <ul>
              {item.sharedInterfaceAccessType.map((entry) => (
                <li>{entry.label}</li>
              ))}
            </ul>
            {" "}
            {t["shared-access-type"]}{" "}
          </li>
        ) : null}
        {item.sharedInterfaceKind.length > 0 ? (
          <li>
            <ul>
              {item.sharedInterfaceKind.map((entry) => (
                <li>{entry.label}</li>
              ))}
            </ul>
            {" "}
            {t["shared-kind"]}{" "}
          </li>
        ) : null}
        {item.facilitatesSharing.length > 0 ? (
          <li class="facilitates-sharing">
            {" "}
            {item.facilitatesSharingText}{" "}
            <a>
              <gov-icon name="info-circle"></gov-icon>
            </a>
            <div style="display: none;">
              <table>
                <thead>
                  <tr>
                    <th>{t["th-corresponding-term"]}</th>
                    <th>{t["th-obtained-by"]}</th>
                    <th>{t["th-shared-as"]}</th>
                    <th>{t["th-shared-by"]}</th>
                  </tr>
                </thead>
                <tbody>
                  {item.facilitatesSharing.map((row) => (
                    <tr>
                      <td>
                        {row.correspondingTerm ? (
                          <>
                            {row.correspondingTermViewer ? (
                              <a
                                href={row.correspondingTermViewer}
                                rel="nofollow noopener noreferrer"
                                target="_blank"
                              >
                                <span data-label="http://www.w3.org/2004/02/skos/core#prefLabel">
                                  {row.correspondingTerm}
                                </span>
                              </a>
                            ) : null}
                            <a href={row.correspondingTerm}>
                              <gov-icon
                                name="box-arrow-up-right"
                                title={t["concept-link-title"]}
                              ></gov-icon>
                            </a>
                          </>
                        ) : null}
                      </td>
                      <td>
                        {row.obtainedBy ? (
                          <a
                            href={row.obtainedBy.href}
                            rel="nofollow noopener noreferrer"
                            target="_blank"
                          >
                            {row.obtainedBy.label}
                          </a>
                        ) : null}
                      </td>
                      <td>
                        {row.sharedAs ? (
                          <a
                            href={row.sharedAs.href}
                            rel="nofollow noopener noreferrer"
                            target="_blank"
                          >
                            {row.sharedAs.label}
                          </a>
                        ) : null}
                      </td>
                      <td>
                        {row.sharedBy ? (
                          <a
                            href={row.sharedBy.href}
                            rel="nofollow noopener noreferrer"
                            target="_blank"
                          >
                            {row.sharedBy.label}
                          </a>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function SeriesSection({ state }: { state: DatasetDetailTemplateModel }) {
  const t = state.translation;
  const series = state.datasetSeries;
  return (
    <gov-container class="dataset-list-container">
      <h2>{t["h2-series"]}</h2>
      <br />
      <div class="resource-list">
        {series.items.map((item) => (
          <div class="resource-list-item">
            <a href={item.href} rel="nofollow noopener noreferrer">
              <h3>{item.title}</h3>
            </a>
            <p>
              {" "}
              {item.description}{" "}
            </p>
          </div>
        ))}
      </div>
      <a href={series.showAllHref}>
        {" "}
        {t["show-all-series"]}{" "}
      </a>
    </gov-container>
  );
}

function ApplicationsSection({
  state,
}: {
  state: DatasetDetailTemplateModel;
}) {
  const t = state.translation;
  const applications = state.applications;
  return (
    <gov-container class="application-list-container">
      <h2>{t["h2-applications"]}</h2>
      <br />
      <div class="document-list">
        {applications.items.map((item) => (
          <div class="document-list-item">
            <a href={item.href} rel="nofollow noopener noreferrer">
              <h3>{item.title}</h3>
            </a>
            <p>
              {" "}
              {item.description}{" "}
            </p>
          </div>
        ))}
      </div>
    </gov-container>
  );
}
