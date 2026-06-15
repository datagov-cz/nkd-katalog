/**
 * @typedef {{
 *   fetchDatasetVdf: (iri: string) => Promise<{usedAsCodelistBy: string[], usingCodelists: string[]}>
 * }} SparqlVdfService
 */

/**
 * Data source for Veřejný datový fond (VDF).
 * @param {import('../connector/sparql.mjs').SparqlConnector} sparqlConnector
 * @returns {SparqlVdfService}
 */
export function createSparqlVdf(sparqlConnector) {
  return {
    "fetchDatasetVdf": (iri) =>
      fetchDatasetVdf(sparqlConnector, iri),
  };
}

/**
 * @param {*} sparqlConnector
 * @param {string} iri
 * @return {Promise<{usedAsCodelistBy:string[], usingCodelists: string[]}>}
 */
async function fetchDatasetVdf(sparqlConnector, iri) {
  const usedBy = await sparqlConnector.executeSparqlSelect(
    createUsingDatasetAsCodelistSparql(iri),
  );

  const usingCodelists = await sparqlConnector.executeSparqlSelect(
    createCodelistsUsedByDatasetSparql(iri),
  );

  return {
    "usedAsCodelistBy": usedBy.map((entry) => (entry["iri"]["value"])),
    "usingCodelists": usingCodelists.map((entry) => (entry["iri"]["value"])),
  }
}

function createUsingDatasetAsCodelistSparql(iri) {
  return `
PREFIX pojmy: <https://slovník.gov.cz/legislativní/sbírka/111/2009/pojem/>

SELECT DISTINCT ?iri WHERE {
  [] a pojmy:údaj ;
      pojmy:je-kódovaný-číselníkem/pojmy:iri-číselníku-v-nkod <${iri}> ;
      pojmy:iri-datové-sady-publikující-veřejný-údaj ?iri .
}
`;
}

function createCodelistsUsedByDatasetSparql(iri) {
  return `
PREFIX pojmy: <https://slovník.gov.cz/legislativní/sbírka/111/2009/pojem/>

SELECT DISTINCT ?iri WHERE {
  [] a pojmy:údaj ;
      pojmy:je-kódovaný-číselníkem/pojmy:iri-číselníku-v-nkod ?iri ;
      pojmy:iri-datové-sady-publikující-veřejný-údaj <${iri}> .
}
`;
}
