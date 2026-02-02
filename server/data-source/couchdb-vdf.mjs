import logger from "../logger";

const VDF_PREFIX = "https://data.gov.cz/slovník/nkod/role-poskytovatele-ve-vdf/";

const VDF_ORIGINATOR = VDF_PREFIX + "původce-vdf";

const VDF_PUBLISHER = VDF_PREFIX + "poskytovatel-vdf";

export function createCouchDbVdf(couchDbConnector) {
  return {
    "fetchPublishersVdf": () =>
      fetchPublishersVdf(couchDbConnector)
  };
}

const COUCHDB_DATABASE_NAME = "static";

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
