import logger from "../logger.ts";
import { hasRequestFailed, HttpConnector, HttpFailed } from "./http-connector.ts";
import {
  SuccessSolrResponse,
  isErrorSolrResponse,
  isSuccessSolrResponse,
} from "./solr-connector-model.ts";

export type SolrQuery = Record<string, string | string[] | number | boolean>;

export interface SolrConnector {
  query<T>(core: string, query: SolrQuery): Promise<SuccessSolrResponse<T>>;
}

class DefaultSolrConnector implements SolrConnector {
  private http: HttpConnector;

  private solrUrl: string;

  constructor(http: HttpConnector, solrUrl: string) {
    this.http = http;
    this.solrUrl = solrUrl;
  }

  async query<T>(
    core: string,
    query: SolrQuery,
  ): Promise<SuccessSolrResponse<T>> {
    const url =
      this.solrUrl + "/" + core + "/query?" + solrQueryToUrlQuery(query);
    const response = await this.http.fetch(url);
    if (hasRequestFailed(response)) {
      throw new HttpFailed(response, "Failed to fetch data from Solr.");
    }
    const payload = await response.json();
    if (isErrorSolrResponse(payload)) {
      logger.info({ query, url }, "Solr request failed.");
      throw new Error("Solr request failed.");
    } else if (isSuccessSolrResponse<T>(payload)) {
      return payload;
    } else {
      logger.warn({ query, url }, "Solr request failed with unknown response.");
      throw new Error("Solr request failed.");
    }
  }
}

function solrQueryToUrlQuery(query: SolrQuery): string {
  return Object.entries(query)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return value
          .map((item) => key + "=" + encodeURIComponent(item))
          .join("&");
      } else {
        return key + "=" + encodeURIComponent(value);
      }
    })
    .join("&");
}

export function createDefaultSolrConnector(
  http: HttpConnector,
  solrUrl: string,
) {
  return new DefaultSolrConnector(http, solrUrl);
}
