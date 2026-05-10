import { ROUTE } from "../route-name.mjs";
import * as components from "../../component/index.mjs";

const SPARQL_SCHEMA = "https://www.w3.org/TR/sparql11-protocol/";

const PU_PREFIX = "https://data.gov.cz/podmínky-užití/";

const AUTHORSHIP_MAP = {
  [PU_PREFIX + "neobsahuje-autorská-díla/"]: () => ({
    "label": "without-authorship",
    "icon": "check-lg",
    "iconStyle": "alright",
    "iconTitle": "without-authorship-comment",
  }),
  [PU_PREFIX + "obsahuje-více-autorských-děl/"]: () => ({
    "label": "with-multiple-authorship",
    "icon": "list",
    "iconStyle": "warning",
    "iconTitle": "with-authorship-comment",
  }),
  "https://creativecommons.org/licenses/by/4.0/": (author) => ({
    "label": "ccby-authorship",
    "icon": "bookmark-fill",
    "iconStyle": "warning",
    "iconTitle": "ccby-authorship-comment",
    "author": author,
  }),
  [null]: () => ({
    "label": "missing-authorship",
    "icon": "exclamation-circle",
    "iconStyle": "danger",
    "iconTitle": "missing-authorship-comment",
  }),
}

const AUTHORSHIP_CUSTOM = (authorship) => ({
  "label": "custom-authorship",
  "icon": "question-circle",
  "iconStyle": "warning",
  "iconTitle": "custom-authorship-comment",
  "href": authorship,
  "showQuality": true,
});

const DATABASE_AUTHORSHIP_MAP = {
  [PU_PREFIX + "není-autorskoprávně-chráněnou-databází/"]: () => ({
    "label": "without-database-authorship",
    "icon": "check-lg",
    "iconStyle": "alright",
    "iconTitle": "without-database-authorship-comment",
  }),
  "https://creativecommons.org/licenses/by/4.0/": (author) => ({
    "label": "ccby-database-authorship",
    "icon": "bookmark-fill",
    "iconStyle": "warning",
    "iconTitle": "ccby-database-authorship-comment",
    "author": author
  }),
  [null]: () => ({
    "label": "missing-database-authorship",
    "icon": "exclamation-circle",
    "iconStyle": "danger",
    "iconTitle": "missing-database-authorship-comment",
  }),
}

const DATABASE_AUTHORSHIP_CUSTOM = (authorship) => ({
  "label": "custom-database-authorship",
  "icon": "question-circle",
  "iconStyle": "warning",
  "iconTitle": "custom-database-authorship-comment",
  "href": authorship,
  "showQuality": true,
});

const PROTECTED_DATABASE_AUTHORSHIP_MAP = {
  [PU_PREFIX + "není-chráněna-zvláštním-právem-pořizovatele-databáze/"]: () => ({
    "label": "without-protected-database-authorship",
    "icon": "check-lg",
    "iconStyle": "alright",
    "iconTitle": "without-protected-database-authorship-comment",
  }),
  "https://creativecommons.org/publicdomain/zero/1.0/": () => ({
    "label": "cc0-protected-database-authorship",
    "icon": "check-lg",
    "iconStyle": "alright",
    "iconTitle": "cc0-protected-database-authorship-comment",
  }),
  "https://creativecommons.org/licenses/by/4.0/": () => ({
    "label": "ccby-database-authorship",
    "icon": "bookmark-fill",
    "iconStyle": "warning",
    "iconTitle": "ccby-database-authorship-comment",
  }),
  [null]: () => ({
    "label": "missing-protected-database-authorship",
    "icon": "exclamation-circle",
    "iconStyle": "danger",
    "iconTitle": "missing-protected-database-authorship-comment",
  }),
}

const PROTECTED_DATABASE_AUTHORSHIP_CUSTOM = (authorship) => ({
  "label": "custom-protected-database",
  "icon": "question-circle",
  "iconStyle": "warning",
  "iconTitle": "custom-protected-database-comment",
  "href": authorship,
  "showQuality": true,
});

const PERSONAL_DATA_MAP = {
  [PU_PREFIX + "obsahuje-osobní-údaje/"]: () => ({
    "label": "with-personal-data-label",
    "icon": "person-fill",
    "iconStyle": "warning",
    "iconTitle": "with-personal-data-comment",
  }),
  [PU_PREFIX + "neobsahuje-osobní-údaje/"]: () => ({
    "label": "without-personal-data-label",
    "icon": "person-fill",
    "iconStyle": "alright",
    "iconTitle": "without-personal-data-comment",
  }),
  [PU_PREFIX + "není-specifikováno-zda-obsahuje-osobní-údaje/"]: () => ({
    "label": "unspecified-personal-data-label",
    "icon": "person-fill",
    "iconStyle": "warning",
    "iconTitle": "unspecified-personal-data-comment",
  }),
  [null]: () => ({
    "label": "missing-personal-data-information-label",
    "icon": "person-fill",
    "iconStyle": "danger",
    "iconTitle": "missing-personal-data-information-comment",
  }),
}

const LEGISLATION_HVD = "http://data.europa.eu/eli/reg_impl/2023/138/oj";

const LEGISLATION_DYNAMIC_DATA = "https://www.e-sbirka.cz/eli/cz/sb/1999/106/2024-01-01/dokument/norma/cast_1/par_3a/odst_6";

export function renderHtml(services, languages, query, data, reply) {
  if (data == null) {
    services.http.handleNotFound(services, reply);
    return;
  }
  const templateData = prepareTemplateData(
    services.configuration, services.translation, services.navigation,
    services.link,
    languages, query, data);
  const template = services.template.view(ROUTE.DATASET_DETAIL);
  reply
    .code(200)
    .header("Content-Type", "text/html; charset=utf-8")
    .send(template(templateData));
}

export function prepareTemplateData(configuration, translation, navigation, link, languages, query, data) {
  return {
    "head": components.createHeadData(configuration),
    "navigation": components.createNavigationData(navigation, languages, query),
    "footer": components.createFooterData(),
    "dataset": prepareDataset(configuration, translation, navigation, link, data),
    "distributions": prepareDistributions(configuration, translation, navigation, query, data),
    "applications": prepareApplications(navigation, data),
    "datasetSeries": prepareDatasetSeries(navigation, data),
    "metadataAsString": JSON.stringify(prepareDatasetMetadata(data), null, 2)
  };
}

function prepareDataset(configuration, translation, navigation, link, { dataset }) {
  const datasetDetailNavigation = navigation.changeView(ROUTE.DATASET_DETAIL);
  const datasetListNavigation = navigation.changeView(ROUTE.DATASET_LIST);
  // heading section
  const heading = {
    "title": dataset.title,
    "openUrl": link.wrapLink(dataset.iri),
    "copyUrl": configuration.client.catalogFormUrl
      + translation.translate("url-copy-dataset")
      + encodeURIComponent(dataset.iri),
  }
  if (dataset.isFromForm) {
    heading.editUrl = configuration.client.catalogFormUrl
    + translation.translate("url-edit-dataset")
    + encodeURIComponent(dataset.iri);
    heading.deleteDatasetUrl = configuration.client.catalogFormUrl
      + translation.translate("url-delete-dataset")
      + encodeURIComponent(dataset.iri);
  } else if (dataset.isFromCatalog) {
    heading.deleteCatalogUrl = configuration.client.catalogFormUrl
      + translation.translate("url-delete-catalog")
      + encodeURIComponent(dataset.localCatalog);
  } else {
    // No actions.
  }
  //
  return {
    "iri": dataset.iri,
    "heading": heading,
    "publisher": {
      "label": dataset.publisher.label,
      "href": datasetListNavigation.linkFromServer({
        "publisher": [dataset.publisher.iri]
      }),
    },
    "description": dataset.description,
    "keywords": dataset.keywords.map(keyword => ({
      "label": keyword,
      "href": datasetListNavigation.linkFromServer({ "keyword": [keyword] }),
    })),
    "themesVisible": dataset.themes.length > 0,
    "themes": dataset.themes.map(item => ({
      "iri": item.iri,
      "label": item.label,
      "href": datasetListNavigation.linkFromServer({ "theme": [item.iri] }),
    })),
    "euroVocThemesVisible": dataset.euroVocThemes.length > 0,
    "euroVocThemes": dataset.euroVocThemes.map(item => ({
      "iri": item.iri,
      "label": item.label,
      "href": datasetListNavigation.linkFromServer({ "theme": [item.iri] }),
    })),
    // [Vztahy ze sémantického slovníku]( configuration.semanticVisualisation + encodeURIComponent(dataset.iri))
    // [Pojmy ze sémantického slovníku](datasetSearchUrl = theme) [](configuration.semanticBrowser + encodeURIComponent(iri))
    // "semanticThemesVisible": dataset.semanticThemes.length > 0,
    // "semanticThemes": dataset.semanticThemes, // TODO ? semanticThemes
    "spatialVisible": dataset.spatial.length > 0,
    "spatial": dataset.spatial,
    //
    "spatialResolutionInMetersVisible": dataset.spatialResolutionInMeters !== null,
    "spatialResolutionInMeters": dataset.spatialResolutionInMeters,
    //
    "temporalResolutionVisible": dataset.temporalResolution !== null,
    "temporalResolution": xsdDurationToString(translation, dataset.temporalResolution),
    //
    "temporalVisible": dataset.temporal !== null,
    "temporal": dataset.temporal === null ? null : temporalAsString(dataset.temporal),
    //
    "documentationVisible": dataset.documentation.length > 0,
    "documentation": dataset.documentation,
    //
    "contactVisible": dataset.contactPoints.length > 0,
    "contact": prepareContactPoints(dataset.contactPoints),
    //
    "conformsToVisible": dataset.conformsTo.length > 0,
    "conformsTo": dataset.conformsTo.map(item => ({
      "href": item.iri,
      "label": item.label ?? translation.translate("show-specification"),
    })),
    //
    "frequencyVisible": dataset.frequency !== null,
    "frequency": {
      "iri": dataset.frequency?.iri,
      "label": dataset.frequency?.label,
    },
    //
    "parentDataset": dataset.parentDataset === null ? null : {
      "href": datasetDetailNavigation.linkFromServer({
        "iri": dataset.parentDataset.iri
      }),
      "label": dataset.parentDataset.title,
    },
    //
    "hvdCategoryVisible": dataset.hvdCategory.length > 0,
    "hvdCategory": dataset.hvdCategory.map(item => ({
      "iri": item.iri,
      "href": datasetListNavigation.linkFromServer({ "hvdCategory": [item.iri] }),
      "label": item.label,
    })),
    "applicableLegislationVisible": dataset.applicableLegislation.length > 0,
    "applicableLegislation": prepareApplicableLegislation(dataset.applicableLegislation),
  };
}

function xsdDurationToString(translation, durationAsStr) {
  if (durationAsStr === null) {
    return null;
  }
  const { year, month, day, hour, minute, second, negative } = parseXsdDuration(durationAsStr);
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

function parseXsdDuration(value) {
  // https://www.w3schools.com/xml/schema_dtypes_date.asp
  const result = {
    "year": null,
    "month": null,
    "day": null,
    "hour": null,
    "minute": null,
    "second": null,
    "negative": value.startsWith("-"),
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

function temporalAsString({ iri, startDate, endDate }) {
  if (startDate === null) {
    if (endDate === null) {
      return iri;
    } else {
      return " - " + removeTimeZone(endDate);
    }
  } else {
    if (endDate === null) {
      return removeTimeZone(startDate) + " - ";
    } else {
      return removeTimeZone(startDate) + " - " + removeTimeZone(endDate);
    }
  }
}

/**
 * Remove time zone, changing YYYY-MM-DD+02:00 to YYYY-MM-DD.
 */
function removeTimeZone(dateAsStr) {
  const plusIndex = dateAsStr.indexOf("+");
  if (plusIndex === -1) {
    return dateAsStr;
  } else {
    return dateAsStr.substr(0, dateAsStr.indexOf("+"));
  }
}

function prepareContactPoints(contactPoints) {
  return contactPoints.map(contactPoint => ({
    "label": contactPoint.title ?? contactPoint.email,
    "href": "mailto:" + contactPoint.email,
  }));
}

function prepareApplicableLegislation(applicableLegislation) {
  const result = applicableLegislation.map(url => ({
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

function createChipForApplicableLegislation(url) {
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

function prepareDistributions(configuration, translation, navigation, query, data) {
  if (data.distributions.items.length === 0) {
    return {
      "visible": false,
    };
  }
  return {
    "visible": true,
    "pagination": {
      "visible": data.distributions.total > query.distributionPageSize,
      "total": data.distributions.total,
      "pageSize": query.distributionPageSize,
      "currentPage": query.distributionPage + 1,
      "linkTemplate": navigation.linkFromServer({
        ...query,
        "distributionPage": "_PAGE_"
      }).replace("_PAGE_", "{PAGE}") // We need '{PAGE}' in link template.
    },
    "items": data.distributions.items.map(item => ({
      "iri": item.iri,
      "title": item.title,
      "format": item.format?.label ?? null,
      // We have one on level of a distribution, another on a level of data service.
      "applicableLegislationVisible": item.applicableLegislation.length > 0,
      "applicableLegislation": prepareApplicableLegislation(item.applicableLegislation),
      //
      ...prepareLegal(translation, item),
      ...prepareDistribution(item),
      ...prepareDataService(configuration, item, item.dataService)
    })),
  };
}

function prepareLegal(translation, distribution) {
  const legal = distribution.legal;
  if (legal === null) {
    if (distribution.license === null) {
      return {
        "missingLegal": true,
      };
    } else {
      return {
        "dcatApLegal": {
          "license": distribution.license
        },
      };
    }
  }

  // Authorship can have a custom value.
  const authorship = AUTHORSHIP_MAP[legal.authorship]?.(legal.author)
    ?? AUTHORSHIP_CUSTOM(legal.authorship);
  if (authorship !== null) {
    authorship.label = translation.translate(authorship.label);
    authorship.iconTitle = translation.translate(authorship.iconTitle);
  }

  // Database authorship can have a custom value.
  const databaseAuthorship = DATABASE_AUTHORSHIP_MAP[legal.databaseAuthorship]?.(legal.databaseAuthor)
    ?? DATABASE_AUTHORSHIP_CUSTOM(legal.databaseAuthorship);
  if (databaseAuthorship !== null) {
    databaseAuthorship.label = translation.translate(databaseAuthorship.label);
    databaseAuthorship.iconTitle = translation.translate(databaseAuthorship.iconTitle);
  }

  // Protected database authorship can have a custom value.
  const protectedDatabaseAuthorship = PROTECTED_DATABASE_AUTHORSHIP_MAP[legal.protectedDatabase]?.()
    ?? PROTECTED_DATABASE_AUTHORSHIP_CUSTOM(legal.protectedDatabase);
  if (protectedDatabaseAuthorship !== null) {
    protectedDatabaseAuthorship.label = translation.translate(protectedDatabaseAuthorship.label);
    protectedDatabaseAuthorship.iconTitle = translation.translate(protectedDatabaseAuthorship.iconTitle);
  }

  // Information about personal information can be missing.
  const personalData = PERSONAL_DATA_MAP[legal.personalData]?.() ?? null;
  if (personalData !== null) {
    personalData.label = translation.translate(personalData.label);
    personalData.iconTitle = translation.translate(personalData.iconTitle);
  }

  return {
    "dcatApCzLegal": {
      authorship,
      databaseAuthorship,
      protectedDatabaseAuthorship,
      personalData
    },
  };
}

function prepareDistribution(distribution) {
  if (distribution.type !== "Distribution") {
    return {
      "distribution": null,
    };
  }
  let downloadArray = distribution.downloadURL;
  if (downloadArray.length === 0 && distribution.accessURL !== null) {
    downloadArray = [distribution.accessURL];
  }
  let mediaType;
  if (distribution.mediaType !== null) {
    mediaType = {
      "iri": distribution.mediaType.iri,
      "label": distribution.mediaType.label,
    }
  }
  return {
    "distribution": {
      "downloadArrayVisible": downloadArray.length > 0,
      "downloadArray": downloadArray,
      "schemaArrayVisible": distribution.conformsTo.length > 0,
      "schemaArray": distribution.conformsTo,
      "mediaType": mediaType,
      "compressFormat": distribution.compressFormat,
      "packageFormat": distribution.packageFormat,
    },
  };
}

function prepareDataService(configuration, distribution, dataService) {
  if (distribution.type !== "DataService" && dataService !== null) {
    return {
      "dataService": null,
    };
  }
  let mediaType;
  if (distribution.mediaType !== null) {
    mediaType = {
      "iri": distribution.mediaType.iri,
      "label": distribution.mediaType.label,
    }
  }
  const client = configuration.client;
  const sparqlCompliant = dataService.conformsTo?.includes(SPARQL_SCHEMA);
  const showSparqlEditor = sparqlCompliant && dataService.endpointURL && client.sparqlEditorUrl;
  return {
    "dataService": {
      "iri": dataService.iri,
      "endpointDescription": dataService.endpointDescription,
      "endpointUrl": dataService.endpointURL,
      "sparqlEditor": showSparqlEditor
        ? `${client.sparqlEditorUrl}#query=${client.sparqlDefaultQuery}&endpoint=${dataService.endpointURL}`
        : null,
      "classesAndProperties": showSparqlEditor && client.sparqlClassAndPropertiesTemplate
        ? client.sparqlClassAndPropertiesTemplate.replace("{}", encodeURIComponent(dataService.endpointURL))
        : null,
      "schemaArrayVisible": dataService.conformsTo.length > 0,
      "schemaArray": dataService.conformsTo,
      "mediaType": mediaType,
      "compressFormat": distribution.compressFormat,
      "packageFormat": distribution.packageFormat,
      "applicableLegislationVisible": dataService.applicableLegislation.length > 0,
    },
  };
}

function prepareApplications(navigation, { applications }) {
  const applicationDetailNavigation = navigation.changeView(ROUTE.APPLICATION_DETAIL);
  return {
    "visible": applications.length > 0,
    "items": applications.map(application => ({
      "title": application.title,
      "description": application.description,
      "href": applicationDetailNavigation.linkFromServer({ "iri": application.iri }),
    })),
  };
}

function prepareDatasetSeries(navigation, { dataset, series }) {
  const datasetDetailNavigation = navigation.changeView(ROUTE.DATASET_DETAIL);
  const datasetListNavigation = navigation.changeView(ROUTE.DATASET_LIST);
  return {
    "visible": series.total > 0,
    "total": series.total,
    "items": series.items.map(dataset => ({
      "title": dataset.title,
      "description": dataset.description,
      "href": datasetDetailNavigation.linkFromServer({ "iri": dataset.iri }),
    })),
    "showAllHref": datasetListNavigation.linkFromServer({
      "isPartOf": dataset.iri,
    })
  };
}

function prepareDatasetMetadata({ dataset, distributions }) {
  return {
    "@context": "http://schema.org/",
    "@type": "Dataset",
    "name": dataset.title,
    "description": dataset.description,
    "url": dataset.iri,
    "keywords": dataset.keywords,
    // "includedInDataCatalog"
    // "spatialCoverage": dataset["spatial"]["@id"]
    // context["temporalCoverage"]: dataset["temporal"]["startDate"] + "/" + dataset["temporal"]["endDate"] + "\"\n"
    "creator": {
      "@type": "Organization",
      "url": dataset.publisher.iri,
      "name": dataset.publisher.label,
    },
    "distribution": distributions.items
      .filter(distribution => distribution.type === "Distribution")
      .map(distribution => ({
        "@type": "DataDownload",
        "contentUrl": distribution.downloadURL?.[0] ?? distribution.accessURL,
        "encodingFormat": distribution.format.label,
      })),
  }
}
