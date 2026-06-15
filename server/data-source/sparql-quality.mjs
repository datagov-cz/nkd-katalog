/**
 * @typedef {{[key:string] : {
 * value: string,
 * lastCheck : string,
 * note: string
 * }  | null }} QualityMeasures
 *
 * @typedef {{ fetchQuality: (languages: string[], iri: string) => Promise<QualityMeasures> }} SparqlQualityService
 */
import { getId, getString, getResource, getEntitiesByType, getValue } from "./shared/jsonld.mjs";
import { selectForLanguages } from "./shared/couchdb-response.mjs";
import { SKOS, DQV, SDMX, SCHEMA } from "./shared/vocabulary.ts";

const QUALITY_PREFIX = "https://data.gov.cz/zdroj/datová-kvalita/metriky/";

const QUALITY_DATASET = {
  "documentation":
    QUALITY_PREFIX + "metrikaDostupnostiDokumentace",
  "specification":
    QUALITY_PREFIX + "metrikaDostupnostiSpecifikace",
};

const LEGAL_QUALITY = {
  "authorship":
    QUALITY_PREFIX + "metrikaDostupnostiPodmínekUžitíAutorskéDílo",
  "authorshipCors":
    QUALITY_PREFIX + "metrikaDostupnostiCORSPodmínekUžitíAutorskéDílo",
  "databaseAuthorship":
    QUALITY_PREFIX + "metrikaDostupnostiPodmínekUžitíAutorskáDatabáze",
  "databaseAuthorshipCors":
    QUALITY_PREFIX + "metrikaDostupnostiCORSPodmínekUžitíAutorskáDatabáze",
  "specialDatabaseAuthorship":
    QUALITY_PREFIX + "metrikaDostupnostiPodmínekUžití"
    + "ZvláštníPrávoPořizovateleDatabáze",
  "specialDatabaseAuthorshipCors":
    QUALITY_PREFIX + "metrikaDostupnostiCORSPodmínekUžití"
    + "ZvláštníPrávoPořizovateleDatabáze",
};

const QUALITY_DISTRIBUTION = {
  "download":
    QUALITY_PREFIX + "metrikaDostupnostiDownloadURL",
  "downloadCors":
    QUALITY_PREFIX + "metrikaDostupnostiCORSDownloadURL",
  "schema":
    QUALITY_PREFIX + "metrikaDostupnostiSchématu",
  "schemaCors":
    QUALITY_PREFIX + "metrikaDostupnostiCORSSchématu",
  "mediaType":
    QUALITY_PREFIX + "metrikaSprávnostiMediaTypu",
};

const QUALITY_DATA_SERVICE = {
  "endpointDescription":
    QUALITY_PREFIX + "metrikaDostupnostiEndpointDescription",
  "endpointDescriptionCors":
    QUALITY_PREFIX + "metrikaDostupnostiCORSEndpointDescription",
  "endpointUrl":
    QUALITY_PREFIX + "metrikaDostupnostiEndpointURL",
  "endpointUrlCors":
    QUALITY_PREFIX + "metrikaDostupnostiCORSEndpointURL",
  "conformsTo":
    QUALITY_PREFIX + "metrikaDostupnostiServiceConformsTo",
  "conformsToCors":
    QUALITY_PREFIX + "metrikaDostupnostiCORSServiceConformsTo",
  "mediaType":
    QUALITY_PREFIX + "metrikaSprávnostiMediaTypu",
}

const QUALITY = {
  ...QUALITY_DATASET,
  ...LEGAL_QUALITY,
  ...QUALITY_DISTRIBUTION,
  ...QUALITY_DATA_SERVICE
};

/**
 * @param {import('../connector/sparql.mjs').SparqlConnector} sparqlConnector
 * @returns {SparqlQualityService}
 */
export function createSparqlQuality(sparqlConnector) {
  return {
    /**
     * @param {string[]} languages
     * @param {string} iri
     * @return {Promise<QualityMeasures>}
     */
    "fetchQuality": (languages, iri) =>
      fetchQuality(sparqlConnector, languages, iri),
  };
}

/**
 * @param {*} sparqlConnector
 * @param {string[]} languages
 * @param {string} iri
 * @return {Promise<QualityMeasures>}
 */
async function fetchQuality(sparqlConnector, languages, iri) {
  const query = createQualitySparql(iri);
  const jsonld = await sparqlConnector.executeSparqlConstruct(query);
  const measures = [];
  for (const entity of getEntitiesByType(jsonld, DQV.QualityMeasurement)) {
    // @lc-entity
    // @lc-identifier quality
    measures.push({
      // @lc-property
      // @lc-name iri
      "iri": getId(entity),
      // @lc-property
      // @lc-name value
      "value": getValue(entity, DQV.value),
      // @lc-property
      // @lc-name lastCheck
      "lastCheck": sdmxRefToDate(getResource(entity, SDMX.refPeriod)),
      // @lc-property
      // @lc-name computedOn
      "computedOn": getResource(entity, DQV.computedOn),
      // @lc-property
      // @lc-name measureOf
      "measureOf": getResource(entity, DQV.isMeasurementOf),
      // @lc-property
      // @lc-name note
      "note": selectForLanguages(languages, getString(entity, SKOS.note)),
      // @lc-property
      // @lc-name object
      "object": getResource(entity, SCHEMA.object),
    });
  }
  return convertMeasuresToObject(measures);
}

/**
 * @param {string} iri
 * @returns {string}
 */
function createQualitySparql(iri) {
  return `
prefix dqv: <http://www.w3.org/ns/dqv#>
prefix sdmx-dimension: <http://purl.org/linked-data/sdmx/2009/dimension#>
prefix skos: <http://www.w3.org/2004/02/skos/core#>
prefix schema: <http://schema.org/>

CONSTRUCT {
  ?measure a dqv:QualityMeasurement ;
    dqv:computedOn <${iri}> ;
    dqv:isMeasurementOf ?MeasurementOf ;
    dqv:value ?value ;
    sdmx-dimension:refPeriod ?refPeriod ;
    skos:note ?note ;
    schema:object ?object .
} WHERE {
  ?measure a dqv:QualityMeasurement ;
    dqv:computedOn <${iri}> ;
    dqv:isMeasurementOf ?MeasurementOf ;
    dqv:value ?value .
  OPTIONAL { ?measure sdmx-dimension:refPeriod ?refPeriod . }
  OPTIONAL { ?measure skos:note ?note . }
  OPTIONAL { ?measure schema:object ?object . }
}
`;
}

/**
 * @param {string} iri
 * @returns {string}
 */
function sdmxRefToDate(iri) {
  if (iri === null) {
    return null;
  }
  return iri.substr(iri.lastIndexOf("/") + 1).replace("T", " ");
}

/**
 * @param {*} measures
 * @returns {QualityMeasures}
 */
function convertMeasuresToObject(measures) {
  const measuresByType = {};
  for (const measure of measures) {
    measuresByType[measure.measureOf] = measure;
  }
  /** @type QualityMeasures */
  const result = {};
  for (const [key, iri] of Object.entries(QUALITY)) {
    const measure = measuresByType[iri];
    if (measure === undefined) {
      result[key] = null;
      continue;
    }
    result[key] = {
      "value": measure["value"],
      "lastCheck": measure["lastCheck"],
      "note": measure["note"],
    };
  }
  return result;
}
