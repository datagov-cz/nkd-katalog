import logger from "../logger.ts";

const VDF_PREFIX = "https://data.gov.cz/slovník/nkod/role-poskytovatele-ve-vdf/";

const VDF_ORIGINATOR = VDF_PREFIX + "původce-vdf";

const VDF_PUBLISHER = VDF_PREFIX + "poskytovatel-vdf";

/**
 * @typedef {{ iri: string, vdfOriginator: unknown, vdfPublisher: unknown }} VdfPublisher
 *
 * @typedef {{ fetchPublishersVdf: () => Promise<VdfPublisher[] | null> }} CouchDbVdfService
 */

/**
 * Data source for Veřejný datový fond (VDF).
 * @param {import('../connector/couchdb.mjs').CouchDbConnector} couchDbConnector
 * @returns {CouchDbVdfService}
 */
export function createCouchDbVdf(couchDbConnector) {
  return {
    "fetchPublishersVdf": () =>
      fetchPublishersVdf(couchDbConnector)
  };
}

const COUCHDB_DATABASE_NAME = "static";

/**
 * @param {import('../connector/couchdb.mjs').CouchDbConnector} couchDbConnector
 * @returns {Promise<VdfPublisher[] | null>}
 */
async function fetchPublishersVdf(couchDbConnector) {
  const response = await couchDbConnector.fetch(
    COUCHDB_DATABASE_NAME, "publishers_vdf");
  if (response["error"] !== undefined) {
    // We assume it is missing.
    logger.error("Can't fetch publisher VDF, error '%s'.", JSON.stringify(response));
    return null;
  }
  const jsonld = response["jsonld"] ?? [];
  return parsePublishersVdf(jsonld);
}

/**
 * @param {object[]} jsonld
 * @returns {VdfPublisher[]}
 */
function parsePublishersVdf(jsonld) {
  const result = [];
  for (const entity of jsonld) {
    const iri = entity["@id"];
    if (iri === undefined) {
      continue;
    }
    result.push({
      "iri": iri,
      "vdfOriginator": entity[VDF_ORIGINATOR],
      "vdfPublisher": entity[VDF_PUBLISHER],
    })
  }
  return result;
}
