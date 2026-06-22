
import { HttpConnector } from "./http-connector.ts";

export function createCouchDbConnector(
  http: HttpConnector, couchDbUrl: string,
): CouchDbConnector {
  return {
    fetch: async (database, identifier) => {
      const url = `${couchDbUrl}/${database}/${encodeURIComponent(identifier)}`;
      const response = await http.fetch(url);
      return await response.json();
    }
  };
}

export interface CouchDbConnector {

  fetch(database: string, identifier: string): Promise<{ error: any } | any>;

}
