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
  Pagination,
} from "../../component/index.mjs";
import { Head } from "../../component/head.tsx";
import type {
  DataService,
  DatasetDetailQuery,
  DatasetDetailState,
  DatasetDetailViewServices,
  DcatApCzLegal,
  DistributionItemState,
  FacilitatesSharingItem,
  FileDistribution,
  HeadingViewModel,
  HrefLabel,
  HrefLabelIri,
  LicenseCondition,
} from "./dataset-detail-state.ts";
import type { Configuration } from "../../configuration.ts";
import type { NavigationEntry } from "../../service/navigation-service.ts";
import type { LinkService } from "../../service/link-service.ts";
import type {
  TranslationService,
} from "../../service/translation-service.ts";
import { NKOD } from "../../data-source/shared/vocabulary.ts";
import { ROUTE } from "../route-name.mjs";
import { headerHtml } from "../../component/header.ts";
import { footerHtml } from "../../component/footer.ts";
import { renderToHtml } from "../../html/render-html.ts";
import { breakLines, escapeExpression } from "../../html/escape.ts";
import { Language } from "../../localization/index.ts";
import { ViewContext } from "../../service/view-context.ts";
import { RelatedItems } from "../../component/detail-parts.tsx";
import {
  containsDynamicData, containsHighValueDataset,
  containsPublicRegistry,
  isDynamicData, isHighValueDataset, containsNonPublicData, containsOpenData,
  isPublicRegistry,
} from "../../dcat-ap-cz/index.ts";
import { DynamicDataChip, HighValueDatasetChip, NonPublicChip, OpenDataChip, PublicRegistryChip } from "../../component/legislation-chips.tsx";

export function renderHtml(
  services: DatasetDetailViewServices,
  languages: Language[],
  data: DatasetDetailViewModel | null,
  query: DatasetDetailQuery,
  reply: FastifyReply,
) {
  if (data == null) {
    services.http.handleNotFound(services, reply);
    return;
  }
  const state = prepareTemplateData(
    services.configuration, services.translation, services.navigation,
    services.link, data, query);
  const ctx: ViewContext = {
    t: services.translation.t,
    language: languages[0],
    navigation: services.navigation
  };
  const html = renderDatasetDetailHtml(state, ctx);
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
  data: DatasetDetailViewModel,
  query: DatasetDetailQuery,
): DatasetDetailState {
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
    dataset: {
      iri: dataset.iri,
      types: dataset.type,
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
      applicableLegislation: dataset.applicableLegislation.map(item => item.url),
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
    //
    query,
  }
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
  return applicableLegislation
    .map(({ url }) => url)
    .toSorted((left, right) => left.localeCompare(right, 'en'));
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
): DistributionItemState | null {
  if (isFileDistribution(value)) {
    const showSharingSpecifications =
      value.sharedInterfaceAccessType.length > 0 ||
      value.sharedInterfaceContentType.length > 0 ||
      value.sharedInterfaceKind.length > 0;
    return {
      ...(showSharingSpecifications ? { sizeMd: "12", sizeLg: "6" }
        : { sizeMd: "6", sizeLg: "4" }),
      iri: value.iri,
      title: value.title,
      format: value.format?.label ?? null,
      applicableLegislation: prepareApplicableLegislation(value.applicableLegislation),
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
        sizeMd: "12", sizeLg: "6"
      } : {
        sizeMd: "6", sizeLg: "4"
      }),
      iri: value.iri,
      title: value.title,
      format: value.format?.label ?? null,
      applicableLegislation: prepareApplicableLegislation(value.applicableLegislation),
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
    iconColor: "success",
    iconTitle: "without-authorship-comment",
    author: null,
    href: null,
    showQuality: false,
  }),
  "https://data.gov.cz/podmínky-užití/obsahuje-více-autorských-děl/": (): LicenseCondition => ({
    label: "with-multiple-authorship",
    icon: "list",
    iconColor: "warning",
    iconTitle: "with-authorship-comment",
    author: null,
    href: null,
    showQuality: false,
  }),
  "https://creativecommons.org/licenses/by/4.0/": (author: string): LicenseCondition => ({
    label: "ccby-authorship",
    icon: "bookmarks",
    iconColor: "warning",
    iconTitle: "ccby-authorship-comment",
    author,
    href: null,
    showQuality: false,
  }),
  null: (): LicenseCondition => ({
    label: "missing-authorship",
    icon: "exclamation-triangle-fill",
    iconColor: "error",
    iconTitle: "missing-authorship-comment",
    author: null,
    href: null,
    showQuality: false,
  }),
}

const AUTHORSHIP_CUSTOM = (authorship): LicenseCondition => ({
  label: "custom-authorship",
  icon: "question-circle",
  iconColor: "warning",
  iconTitle: "custom-authorship-comment",
  href: authorship,
  showQuality: true,
  author: null,
});

const DATABASE_AUTHORSHIP_MAP = {
  "https://data.gov.cz/podmínky-užití/není-autorskoprávně-chráněnou-databází/": (): LicenseCondition => ({
    label: "without-database-authorship",
    icon: "check-lg",
    iconColor: "success",
    iconTitle: "without-database-authorship-comment",
    author: null,
    href: null,
    showQuality: false,
  }),
  "https://creativecommons.org/licenses/by/4.0/": (author: string): LicenseCondition => ({
    label: "ccby-database-authorship",
    icon: "bookmarks",
    iconColor: "warning",
    iconTitle: "ccby-database-authorship-comment",
    author,
    href: null,
    showQuality: false,
  }),
  null: (): LicenseCondition => ({
    label: "missing-database-authorship",
    icon: "exclamation-triangle-fill",
    iconColor: "error",
    iconTitle: "missing-database-authorship-comment",
    author: null,
    href: null,
    showQuality: false,
  }),
}

const DATABASE_AUTHORSHIP_CUSTOM = (authorship): LicenseCondition => ({
  label: "custom-database-authorship",
  icon: "question-circle",
  iconColor: "warning",
  iconTitle: "custom-database-authorship-comment",
  href: authorship,
  showQuality: true,
  author: null,
});

const PROTECTED_DATABASE_AUTHORSHIP_MAP = {
  "https://data.gov.cz/podmínky-užití/není-chráněna-zvláštním-právem-pořizovatele-databáze/": (): LicenseCondition => ({
    label: "without-protected-database-authorship",
    icon: "check-lg",
    iconColor: "success",
    iconTitle: "without-protected-database-authorship-comment",
    author: null,
    href: null,
    showQuality: false,
  }),
  "https://creativecommons.org/publicdomain/zero/1.0/": (): LicenseCondition => ({
    label: "cc0-protected-database-authorship",
    icon: "check-lg",
    iconColor: "success",
    iconTitle: "cc0-protected-database-authorship-comment",
    author: null,
    href: null,
    showQuality: false,
  }),
  "https://creativecommons.org/licenses/by/4.0/": (): LicenseCondition => ({
    label: "ccby-database-authorship",
    icon: "bookmarks",
    iconColor: "warning",
    iconTitle: "ccby-database-authorship-comment",
    author: null,
    href: null,
    showQuality: false,
  }),
  null: (): LicenseCondition => ({
    label: "missing-protected-database-authorship",
    icon: "exclamation-triangle-fill",
    iconColor: "error",
    iconTitle: "missing-protected-database-authorship-comment",
    author: null,
    href: null,
    showQuality: false,
  }),
}

const PROTECTED_DATABASE_AUTHORSHIP_CUSTOM = (authorship): LicenseCondition => ({
  label: "custom-protected-database",
  icon: "question-circle",
  iconColor: "warning",
  iconTitle: "custom-protected-database-comment",
  href: authorship,
  showQuality: true,
  author: null,
});

const PERSONAL_DATA_MAP = {
  "https://data.gov.cz/podmínky-užití/obsahuje-osobní-údaje/": (): LicenseCondition => ({
    label: "with-personal-data-label",
    icon: "person-fill",
    iconColor: "warning",
    iconTitle: "with-personal-data-comment",
    iconType: "bootstrap",
    author: null,
    href: null,
    showQuality: false,
  }),
  "https://data.gov.cz/podmínky-užití/neobsahuje-osobní-údaje/": (): LicenseCondition => ({
    label: "without-personal-data-label",
    icon: "person-fill",
    iconColor: "success",
    iconTitle: "without-personal-data-comment",
    iconType: "bootstrap",
    author: null,
    href: null,
    showQuality: false,
  }),
  "https://data.gov.cz/podmínky-užití/není-specifikováno-zda-obsahuje-osobní-údaje/": (): LicenseCondition => ({
    label: "unspecified-personal-data-label",
    icon: "person-fill",
    iconColor: "warning",
    iconTitle: "unspecified-personal-data-comment",
    iconType: "bootstrap",
    author: null,
    href: null,
    showQuality: false,
  }),
  null: (): LicenseCondition => ({
    label: "missing-personal-data-information-label",
    icon: "person-fill",
    iconColor: "error",
    iconTitle: "missing-personal-data-information-comment",
    iconType: "bootstrap",
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

export function renderDatasetDetailHtml(
  state: DatasetDetailState,
  ctx: ViewContext,
): string {
  return `<!DOCTYPE html>
  <html dir="ltr" lang="${ctx.language}">
  <head>${renderToHtml(<DatasetDetailHead state={state} ctx={ctx} />)}</head>
  <body data-sparql-endpoint="${escapeExpression(state.labelEndpoint)}">
    <div class="gov-story-theme-scope">
      ${headerHtml(ctx.navigation, ctx.language, state.query)}
      ${renderToHtml(<DatasetProperties state={state} ctx={ctx} />)}
      ${state.distributions.visible ? renderToHtml(<Distributions state={state} ctx={ctx} />) : ""}
      ${state.datasetSeries.visible ? renderToHtml(<SeriesSection state={state} ctx={ctx} />) : ""}
      ${state.applications.visible ? renderToHtml(<ApplicationsSection state={state} ctx={ctx} />) : ""}
      ${footerHtml(ctx.language)}
    </div>
    <script type="application/ld+json">${state.metadataAsString}</script>
  </body>
  </html>`;
}

function DatasetDetailHead({ state, ctx }: {
  state: DatasetDetailState,
  ctx: ViewContext,
}) {
  return (
    <>
      <Head state={state.head} />
      <title>{state.dataset.heading.title} - {ctx.t("title-suffix")}</title>
      <meta name="description" content={ctx.t("page-description")} />
      <link rel="canonical" href="/dataset" />
      <link rel="alternate" href="/datová-sada" hreflang="cs" />
      <link rel="alternate" href="/dataset" hreflang="en" />
    </>
  );
}

function DatasetProperties({ state, ctx }: {
  state: DatasetDetailState,
  ctx: ViewContext,
}) {
  const dataset = state.dataset;
  const heading = dataset.heading;
  return (
    <gov-container className="dataset-container" data-iri={dataset.iri}>
      {/* Header section */}
      <div>
        <h1 className="inline">{heading.title}</h1>
        <span className="x-large">
          <a href={heading.openUrl ?? ""}>
            <gov-icon name="box-arrow-up-right" title={ctx.t("open-link-title")} />
          </a>
          {heading.editUrl ? (
            <a href={heading.editUrl}>
              <gov-icon name="pencil" title={ctx.t("edit-dataset-title")} type="bootstrap" />
            </a>
          ) : null}
          {heading.copyUrl ? (
            <a href={heading.copyUrl}>
              <gov-icon name="copy" title={ctx.t("copy-dataset-title")} />
            </a>
          ) : null}
          {heading.deleteDatasetUrl ? (
            <a href={heading.deleteDatasetUrl}>
              <gov-icon name="trash" title={ctx.t("delete-dataset-title")} type="bootstrap" />
            </a>
          ) : null}
          {heading.deleteCatalogUrl ? (
            <a href={heading.deleteCatalogUrl}>
              <gov-icon name="trash" title={ctx.t("delete-catalog-title")} type="bootstrap" />
            </a>
          ) : null}
        </span>
        {dataset.publisher ? (
          <a href={dataset.publisher.href}>
            <h2>{dataset.publisher.label}</h2>
          </a>
        ) : null}
      </div>
      <div className="chip-container mb-2">
        {containsOpenData(dataset.types) ? (
          <OpenDataChip ctx={ctx} />
        ) : null}
        {containsNonPublicData(dataset.types) ? (
          <NonPublicChip ctx={ctx} />
        ) : null}
        <LegislationChips legislation={dataset.applicableLegislation} ctx={ctx} id="dataset-legislation" />
      </div>
      <div className="chip-container mb-2">
        {dataset.keywords.map((keyword) => (
          <gov-chip
            color="primary"
            type="outlined"
            size="s"
            href={keyword.href}
          >
            {keyword.label}
          </gov-chip>
        ))}
      </div>
      <p dangerouslySetInnerHTML={{ __html: breakLines(dataset.description) }} />
      {/* Properties */}
      <gov-grid gap="l" className="gov-card-grid properties">
        {/* First column */}
        <gov-grid-item col-span="12" col-span-md="3">
          {dataset.themesVisible ? (
            <Dl term={ctx.t("dt-theme")}>
              {dataset.themes.map((item) => (
                <DdLink item={item} title={ctx.t("go-to-link")} />
              ))}
            </Dl>
          ) : null}
          {dataset.euroVocThemesVisible ? (
            <Dl term={ctx.t("dt-eurovoc")}>
              {dataset.euroVocThemes.map((item) => (
                <DdLink item={item} title={ctx.t("go-to-link")} />
              ))}
            </Dl>
          ) : null}
        </gov-grid-item>
        {/* Second column */}
        <gov-grid-item col-span="12" col-span-md="3">
          {dataset.spatialVisible ? (
            <Dl term={ctx.t("dt-spatial")}>
              {dataset.spatial.map((item) => (
                <dd>
                  {" "}
                  {item.label}{" "}
                  <a
                    href={item.iri ?? ""}
                    title={ctx.t("go-to-link")}
                    rel="nofollow noopener noreferrer"
                    target="_blank"
                  >
                    <gov-icon name="box-arrow-up-right" />
                  </a>
                </dd>
              ))}
            </Dl>
          ) : null}
          {dataset.spatialResolutionInMetersVisible ? (
            <Dl term={ctx.t("dt-spatial-resolution")}>
              <dd>
                {" "}
                {dataset.spatialResolutionInMeters}{" "}
              </dd>
            </Dl>
          ) : null}
          {dataset.temporalVisible ? (
            <Dl term={ctx.t("dt-temporal")}>
              <dd>
                {" "}
                {dataset.temporal}{" "}
              </dd>
            </Dl>
          ) : null}
          {dataset.temporalResolutionVisible ? (
            <Dl term={ctx.t("dt-temporal-resolution")}>
              <dd>
                {" "}
                {dataset.temporalResolution}{" "}
              </dd>
            </Dl>
          ) : null}
        </gov-grid-item>
        {/* Third column */}
        <gov-grid-item col-span="12" col-span-md="3">
          {dataset.documentation.length > 0 ? (
            <Dl term={ctx.t("dt-documentation")}>
              {dataset.documentation.map((url) => (
                <dd className="documentation">
                  <a href={url}>{ctx.t("show-documentation")}</a>
                  <span className="quality"></span>
                </dd>
              ))}
            </Dl>
          ) : null}
          {dataset.contactVisible ? (
            <Dl term={ctx.t("dt-contact")}>
              {dataset.contact.map((item) => (
                <dd>
                  <a href={item.href}>{item.label}</a>
                </dd>
              ))}
            </Dl>
          ) : null}
          {dataset.conformsToVisible ? (
            <Dl term={ctx.t("dt-specification")}>
              {dataset.conformsTo.map((item) => (
                <dd className="specification">
                  <a href={item.href}>{item.label}</a>
                  <span className="quality"></span>
                </dd>
              ))}
            </Dl>
          ) : null}
        </gov-grid-item>
        {/* Fourth column */}
        <gov-grid-item col-span="12" col-span-md="3">
          {dataset.frequencyVisible && dataset.frequency ? (
            <Dl term={ctx.t("dt-frequency")}>
              <dd>
                {" "}
                {dataset.frequency.label}{" "}
                <a
                  href={dataset.frequency.iri ?? ""}
                  title={ctx.t("go-to-link")}
                  rel="nofollow noopener noreferrer"
                  target="_blank"
                >
                  <gov-icon name="box-arrow-up-right" />
                </a>
              </dd>
            </Dl>
          ) : null}
          {dataset.hvdCategoryVisible ? (
            <Dl term={ctx.t("dt-hvd-category")}>
              {dataset.hvdCategory.map((item) => (
                <DdLink item={item} title={ctx.t("go-to-link")} />
              ))}
            </Dl>
          ) : null}
          {dataset.landingPage ? (
            <Dl term={ctx.t("dt-landing-page")}>
              <dd>
                <a href={dataset.landingPage}>
                  {" "}
                  {ctx.t("show-landing-page")}{" "}
                </a>
              </dd>
            </Dl>
          ) : null}
          {dataset.publicInformationSystem.length > 0 ? (
            <Dl term="ISVS">
              {dataset.publicInformationSystem.map((item) => (
                <dd>
                  <a href={item.href}>{item.label}</a>
                </dd>
              ))}
            </Dl>
          ) : null}
          {dataset.concernTerm.length > 0 ? (
            <Dl term={ctx.t("dt-concepts")}>
              {dataset.concernTerm.map((item) => (
                <dd>
                  <a href={item.viewer}>
                    <span data-label="http://www.w3.org/2004/02/skos/core#prefLabel">
                      {item.url}
                    </span>
                  </a>
                  <a href={item.url}>
                    <gov-icon
                      name="box-arrow-up-right"
                      title={ctx.t("concept-link-title")}
                    />
                  </a>
                </dd>
              ))}
            </Dl>
          ) : null}
        </gov-grid-item>
      </gov-grid>
      {/* Parent dataset */}
      {dataset.parentDataset === null ? null : (
        <p>
          {ctx.t("part-of-series")}
          <a href={dataset.parentDataset.href} title={ctx.t("series-link-title")}>
            {dataset.parentDataset.label}
          </a>
          .
        </p>
      )}
      <br />
    </gov-container>
  );
}

function LegislationChips({ id, legislation, ctx }: {
  id: string,
  legislation: string[],
  ctx: ViewContext,
}) {
  if (legislation.length === 0) {
    return null;
  }
  return (
    <>
      {containsHighValueDataset(legislation) ? (
        <HighValueDatasetChip ctx={ctx} />
      ) : null}
      {containsDynamicData(legislation) ? (
        <DynamicDataChip ctx={ctx} />
      ) : null}
      {containsPublicRegistry(legislation) ? (
        <PublicRegistryChip ctx={ctx} />
      ) : null}
      <gov-chip color="primary" type="outlined" size="s" tag="button" data-toggle="dialog" data-target={id}>
        §
      </gov-chip>
      {/* TODO accessible-close-label="Close dialog box with more information" */}
      <gov-dialog role="dialog" id={id} >
        <h2 slot="title">{ctx.t("modal-legislation")}</h2>
        <ul>
          {legislation.map((item) => (
            <li>
              {isHighValueDataset(item) ? <HighValueDatasetChip ctx={ctx} /> : null}
              {isDynamicData(item) ? <DynamicDataChip ctx={ctx} /> : null}
              {isPublicRegistry(item) ? <PublicRegistryChip ctx={ctx} /> : null}
              <a href={item} rel="nofollow noopener noreferrer" target="_blank">
                {item}
              </a>
            </li>
          ))}
        </ul>
      </gov-dialog>
    </>
  );
}

function Dl({ term, children }: { term: string, children: any }) {
  return (
    <dl>
      <dt>{term}</dt>
      {children}
    </dl>
  );
}

function DdLink({ item, title }: { item: HrefLabelIri, title: string }) {
  return (
    <dd>
      <a href={item.href ?? ""}>{` ${item.label} `}</a>
      <a
        href={item.iri ?? ""}
        title={title}
        rel="nofollow noopener noreferrer"
        target="_blank"
      >
        <gov-icon name="box-arrow-up-right" />
      </a>
    </dd>
  );
}

function Distributions({ state, ctx }: {
  state: DatasetDetailState,
  ctx: ViewContext,
}) {
  const { items, pagination } = state.distributions;
  return (
    <gov-container className="distribution-container">
      <h2>{ctx.t("h2-distributions")}</h2>
      <br />
      <gov-grid gap="l">
        {items.map((item, index) => (
          <gov-grid-item col-span="12" col-span-md={item.sizeMd} col-span-lg={item.sizeLg}>
            <DistributionItem index={index} state={item} ctx={ctx} />
          </gov-grid-item>
        ))}
      </gov-grid>
      {pagination.visible ? (
        <gov-grid-item col-span="12">
          <Pagination state={{ ...pagination, pageSizeHref: null }} ctx={ctx} />
        </gov-grid-item>
      ) : null}
    </gov-container>
  );
}

function DistributionItem({ index, state, ctx }: {
  index: number,
  state: DistributionItemState,
  ctx: ViewContext,
}) {
  return (
    <div className="distribution-item-wrap m-1 p-2" data-iri={state.iri}>
      <h3 className="gov-text--xl">{state.title}</h3>
      <h4 className="gov-text--xl gov-color--secondary-700 break-word-wrap">
        {state.format}
      </h4>
      {state.applicableLegislation.length > 0 ? (
        <div className="chip-container mb-2">
          <LegislationChips legislation={state.applicableLegislation} ctx={ctx} id={`distribution-legislation-${index}`} />
        </div>
      ) : null}
      <div className="flex-row">
        {state.missingLegal ? (
          <div>
            <div>
              <h5 className="gov-text--l gov-color--secondary-700">
                {ctx.t("terms-unspecified")}
              </h5>
            </div>
          </div>
        ) : null}
        {state.dcatApLegal ? (
          <div>
            <div>
              <a href="" rel="nofollow noopener noreferrer" target="_blank">
                {ctx.t("terms-of-use-link")}
              </a>
            </div>
          </div>
        ) : null}
        {state.dcatApCzLegal ? (
          <DcatApCzLicenseColumn state={state.dcatApCzLegal} ctx={ctx} />
        ) : null}
        {state.distribution ? (
          <FileDistributionColumn state={state.distribution} ctx={ctx} />
        ) : null}
        {state.dataService ? (
          <DataServiceColumn state={state.dataService} ctx={ctx} />
        ) : null}
        {state.showSharingSpecifications ? (
          <SharingSpecColumn index={index} state={state} ctx={ctx} />
        ) : null}
      </div>
    </div>
  );
}

/**
 * Renders DcatApCz style license.
 */
function DcatApCzLicenseColumn({ state, ctx }: {
  state: DcatApCzLegal,
  ctx: ViewContext,
}) {
  return (
    <div className="distribution-item-wrap-column">
      <div>
        <h5 className="gov-text--l gov-color--secondary-700">{ctx.t("terms-of-use")}</h5>
      </div>
      <ul>
        <LicenseCondition
          className="authorship"
          condition={state.authorship}
          fallback={ctx.t("copyrighted-work")}
        />
        <LicenseCondition
          className="databaseAuthorship"
          condition={state.databaseAuthorship}
          fallback={ctx.t("copyrighted-database")}
        />
        <LicenseCondition
          className="protectedDatabaseAuthorship"
          condition={state.protectedDatabaseAuthorship}
          fallback={ctx.t("sui-generis")}
        />
        <li>
          {state.personalData === null ? null : (
            <div>
              {state.personalData.label}
              <gov-icon
                name={state.personalData.icon}
                color={state.personalData.iconColor}
                title={state.personalData.iconTitle}
                type={state.personalData.iconType}
              />
            </div>
          )}
          {ctx.t("personal-data")}
        </li>
      </ul>
    </div>
  );
}

function LicenseCondition({ className, condition, fallback, }: {
  className: string,
  condition: LicenseCondition,
  fallback: string,
}) {
  return (
    <li className={className}>
      {condition.showQuality ? <span className="quality"></span> : null}
      <div>
        {condition.href ? (
          <a
            href={condition.href}
            rel="nofollow noopener noreferrer"
            target="_blank"
          >
            {condition.label}
          </a>
        ) : condition.label}
        <gov-icon
          name={condition.icon}
          color={condition.iconColor}
          title={condition.iconTitle}
        />
      </div>
      {condition.author ? condition.author : fallback}
    </li>
  );
}

/**
 * Renders a column for a file distribution.
 */
function FileDistributionColumn({ state, ctx }: {
  state: FileDistribution, ctx: ViewContext,
}) {
  return (
    <div className="distribution-item-wrap-column">
      <div>
        <h5 className="gov-text--l gov-color--secondary-700">
          {ctx.t("h5-downloadable-file")}
        </h5>
      </div>
      <ul>
        {state.downloadArray.length > 0 ? (
          <li>
            {state.downloadArray.map((url) => (
              <div className="download">
                <a href={url}>{ctx.t("download")}</a>
                <span className="quality"></span>
              </div>
            ))}
            {state.access ? (
              <div className="access">
                <a href={state.access}>{ctx.t("access-information")}</a>
                <span className="quality"></span>
              </div>
            ) : null}
          </li>
        ) : null}
        {state.conformsTo.length > 0 ? (
          <li className="schema">
            {state.conformsTo.map((url) => (
              <>
                <a href={url}>{ctx.t("schema")}</a>
                <span className="quality"></span>
              </>
            ))}
          </li>
        ) : null}
        {state.mediaType ? (
          <li>
            <div className="mediaType break-word-wrap">
              {state.mediaType.label}
              <a href={state.mediaType.href}>
                <gov-icon name="box-arrow-up-right" />
              </a>
              <span className="quality"></span>
            </div>
            {ctx.t("media-type")}
          </li>
        ) : null}
        {state.compressFormat ? (
          <li>
            <div>
              {state.compressFormat.label}
              <a href={state.compressFormat.href}>
                <gov-icon name="box-arrow-up-right" />
              </a>
            </div>
            {ctx.t("compress-format")}
          </li>
        ) : null}
        {state.packageFormat ? (
          <li>
            <div>
              {state.packageFormat.label}
              <a href={state.packageFormat.href}>
                <gov-icon name="box-arrow-up-right" />
              </a>
            </div>
            {ctx.t("package-format")}
          </li>
        ) : null}
      </ul>
    </div>
  );
}

/**
 * Renders a column for a distribution with data service.
 */
function DataServiceColumn({ state, ctx }: {
  state: DataService, ctx: ViewContext,
}) {
  return (
    <div
      className="distribution-item-wrap-column data-service"
      data-iri={state.iri}
    >
      <div>
        <h5 className="gov-text--l gov-color--secondary-700">
          {ctx.t("h5-data-service")}
        </h5>
      </div>
      <ul>
        <li>
          <div className="endpointDescription">
            <a href={state.endpointDescription}>{ctx.t("endpoint-description")}</a>
            <span className="quality"></span>
          </div>
          {state.access ? (
            <div className="access">
              <a href={state.access}>{ctx.t("access-information")}</a>
              <span className="quality"></span>
            </div>
          ) : null}
        </li>
        <li>
          <div className="endpointUrl">
            <a href={state.endpointUrl}>Endpoint</a>
            <span className="quality"></span>
          </div>
          {state.sparqlEditor ? (
            <div>
              <a href={state.sparqlEditor}>{ctx.t("sparql-query")}</a>
            </div>
          ) : null}
          {state.classesAndProperties ? (
            <div>
              <a href={state.classesAndProperties}>
                {ctx.t("classes-and-properties")}
              </a>
            </div>
          ) : null}
        </li>
        {state.conformsTo.length > 0 ? (
          <li className="schema">
            {state.conformsTo.map((url) => (
              <>
                <a href={url}>Standard</a>
                <span className="quality"></span>
              </>
            ))}
          </li>
        ) : null}
        {state.contact.length > 0 ? (
          <li>
            <div>
              {state.contact.map((contact) => (
                <a href={contact.href}>{contact.label}</a>
              ))}
            </div>
            {ctx.t("label-contact")}
          </li>
        ) : null}
        {state.documentation.length > 0 ? (
          <li>
            {state.documentation.map((url) => (
              <a href={url}>{ctx.t("show-documentation")}</a>
            ))}
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function SharingSpecColumn({ index, state, ctx }: {
  index: number,
  state: DistributionItemState;
  ctx: ViewContext,
}) {
  const id = `${index}-sharing-specification`;
  return (
    <div className="distribution-item-wrap-column">
      <div>
        <h5 className="gov-text--l gov-color--secondary-700">
          {ctx.t("h5-sharing-specification")}
        </h5>
      </div>
      <ul>
        {state.sharedInterfaceContentType.length > 0 ? (
          <li>
            <ul>
              {state.sharedInterfaceContentType.map((entry) => (
                <li>{entry.label}</li>
              ))}
            </ul>
            {ctx.t("shared-content-type")}
          </li>
        ) : null}
        {state.sharedInterfaceAccessType.length > 0 ? (
          <li>
            <ul>
              {state.sharedInterfaceAccessType.map((entry) => (
                <li>{entry.label}</li>
              ))}
            </ul>
            {ctx.t("shared-access-type")}
          </li>
        ) : null}
        {state.sharedInterfaceKind.length > 0 ? (
          <li>
            <ul>
              {state.sharedInterfaceKind.map((entry) => (
                <li>{entry.label}</li>
              ))}
            </ul>
            {ctx.t("shared-kind")}
          </li>
        ) : null}
        {state.facilitatesSharing.length > 0 ? (
          <li>
            {state.facilitatesSharingText}
            <gov-chip
              color="primary"
              type="outlined"
              size="s"
              tag="button"
              data-toggle="dialog"
              data-target={id}
              aria-label={ctx.t("modal-facilitates-sharing")}
            >
              <gov-icon name="info-circle" />
            </gov-chip>
            {/* TODO accessible-close-label="Close dialog box with more information" */}
            <gov-dialog role="dialog" id={id} >
              <h2 slot="title">{state.facilitatesSharingText}</h2>
              <table>
                <thead>
                  <tr>
                    <th>{ctx.t("th-corresponding-term")}</th>
                    <th>{ctx.t("th-obtained-by")}</th>
                    <th>{ctx.t("th-shared-as")}</th>
                    <th>{ctx.t("th-shared-by")}</th>
                  </tr>
                </thead>
                <tbody>
                  {state.facilitatesSharing.map((row) => (
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
                                title={ctx.t("concept-link-title")}
                              />
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
            </gov-dialog>
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function SeriesSection({ state, ctx }: { state: DatasetDetailState, ctx: ViewContext }) {
  const series = state.datasetSeries;
  return (
    <gov-container className="dataset-list-container">
      <h2>{ctx.t("h2-series")}</h2>
      <br />
      <RelatedItems items={series.items} />
      <br />
      <a href={series.showAllHref}>
        {ctx.t("show-all-series")}
      </a>
    </gov-container>
  );
}

function ApplicationsSection({ state, ctx }: {
  state: DatasetDetailState,
  ctx: ViewContext
}) {
  const applications = state.applications;
  return (
    <gov-container className="application-list-container">
      <h2>{ctx.t("h2-applications")}</h2>
      <br />
      <RelatedItems items={applications.items} />
    </gov-container>
  );
}
