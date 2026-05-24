
export function createHttpConnector() : HttpConnector {
  return new DefaultHttpConnector();
}

export interface HttpConnector {

  /**
   * Fetch and return content from given URL.
   * @throws {@link HttpFailed}
   */
  fetch(url: string): Promise<HttpResponse>;
}

export interface HttpResponse {

  /**
   * HTTP status code.
   */
  status: number;

  /**
   * Convert content to JSON.
   */
  json: () => Promise<unknown>;
}

/**
 * Use this error to report failed HTTP request.
 */
export class HttpFailed extends Error {
  constructor(response: HttpResponse, message: string) {
    super(`HTTP request failed with status ${response.status}: ${message}`);
  }
}

class DefaultHttpConnector implements HttpConnector {
  fetch(url: string): Promise<HttpResponse> {
    return fetch(url);
  }
}

export function hasRequestFailed(response: HttpResponse): boolean {
  return response.status > 299;
}
