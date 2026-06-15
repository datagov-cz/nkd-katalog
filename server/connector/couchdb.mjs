/**
 * @typedef {{ fetch: (database: string, identifier: string) => Promise<any> }} CouchDbConnector
 */

/**
 * @param {string} couchDbUrl
 * @param {import('./http-connector.ts').HttpConnector} http
 * @returns {CouchDbConnector}
 */
export function createCouchDbConnector(couchDbUrl, http) {
  return {
    "fetch": (database, identifier) =>
      executeQuery(couchDbUrl, http, database, identifier),
  };
}

/**
 * @param {string} couchDbUrl
 * @param {import('./http-connector.ts').HttpConnector} http
 * @param {string} database
 * @param {string} identifier
 * @returns {Promise<any>}
 */
async function executeQuery(couchDbUrl, http, database, identifier) {
  const url = couchDbUrl + "/" + database + "/" + encodeURIComponent(identifier);
  const response = await http.fetch(url);
  return await response.json();
}
