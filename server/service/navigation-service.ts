import * as querystring from "node:querystring";

/**
 * Given navigation and server query, this callback can modify content of the
 * query before we create a link.
 */
const NOOP = (_, serverQuery) => serverQuery;

/**
 * @typedef {{
 *   queryArgumentFromClient: (clientQuery: object, serverKey: string) => string | null,
 *   queryArgumentArrayFromClient: (clientQuery: object, serverKey: string) => string[],
 *   argumentFromServer: (serverKey: string) => string | null,
 *   linkFromServer: (query: object) => string,
 *   changeLanguage: (language: string) => NavigationEntry,
 *   changeView: (viewName: string) => NavigationEntry,
 *   setNavigationData: (serverToLocal: object) => NavigationEntry,
 *   setBeforeLink: (callback: Function) => NavigationEntry,
 * }} NavigationEntry
 */

export function createNavigationService(): NavigationService {
  return new DefaultNavigationService();
}

export interface NavigationService {

  /**
   * Return navigation for given view in given language.
   */
  view: (language: Language, viewName: string) => NavigationEntry;

}

type Language = "cs" | "en";

export interface NavigationEntry {

  setNavigationData(serverToLocal: {
    path: string;
    query: Record<string, string | string[]>;
    argument: Record<string, string>;
  }): NavigationEntry;

  /**
   * Called on server query before it is translated into a client URL query.
   */
  setBeforeLink(beforeLink: BeforeLink): NavigationEntry;

  /**
   * Returns a new entry with changed language.
   */
  changeLanguage(language: Language): NavigationEntry;

  /**
   * Returns a new entry with the same language but for a different view.
   */
  changeView(viewName: string): NavigationEntry;

  /**
   * Returns a value, as an array, from user query under given server key.
   */
  queryArgumentArrayFromClient(
    clientQuery: Record<string, string | string[]>,
    serverKey: string,
  ): string[] | null;

  /**
   * Returns a value from user query under given server key.
   */
  queryArgumentFromClient(
    clientQuery: Record<string, string | string[]>,
    serverKey: string,
  ): string | null;

  /**
   * Returns local argument for server key.
   */
  argumentFromServer(serverKey: string): string | null;

  /**
   * Returns a relative link to this view with given query.
   */
  linkFromServer(serverQuery: Record<string, string | number | string[]>): string;

}

type BeforeLink = (
  server: any, serverQuery: Record<string, string>,
) => Record<string, string>;

interface NavigationEntryData {

  path: string;

  query: Record<string, string>;

  argument: Record<string, string>;

  beforeLink: BeforeLink;

}

class DefaultNavigationService {

  readonly data: { [key: string]: NavigationEntryData } = {};

  view(language: Language, viewName: string) {
    const key = language + ":" + viewName;
    if (this.data[key] === undefined) {
      this.data[key] = {
        "path": "",
        "query": {},
        "argument": {},
        "beforeLink": NOOP,
      };
    }
    return new DefaultNavigationEntry(this, language, viewName, this.data[key]);
  }

}

class DefaultNavigationEntry {

  readonly parent: NavigationService;

  readonly language: Language;

  readonly viewName: string;

  readonly data: NavigationEntryData;

  constructor(parent, language, viewName, data) {
    this.parent = parent;
    this.language = language;
    this.viewName = viewName;
    this.data = data;
  }

  setNavigationData(serverToLocal) {
    this.data.path = serverToLocal.path;
    this.data.query = serverToLocal.query;
    this.data.argument = serverToLocal.argument;
    return this;
  }

  setBeforeLink(callback) {
    this.data.beforeLink = callback;
    return this;
  }

  changeLanguage(language) {
    return this.parent.view(language, this.viewName);
  }

  changeView(viewName) {
    return this.parent.view(this.language, viewName);
  }

  queryArgumentArrayFromClient(clientQuery, serverKey) {
    const value = this.getClientQueryValue(clientQuery, serverKey);
    if (Array.isArray(value)) {
      return value;
    }
    return asArray(value);
  }

  private getClientQueryValue(clientQuery, serverKey) {
    const clientKey = this.data.query[serverKey];
    if (Array.isArray(clientKey)) {
      // We have multiple options, we try them all in given order
      // reading the first one.
      for (const key of clientKey) {
        const value = clientQuery[key];
        if (value === undefined) {
          continue;
        }
        return value;
      }
      return null;
    } else {
      return clientQuery[clientKey] ?? null;
    }
  }

  queryArgumentFromClient(clientQuery, serverKey) {
    const value = this.getClientQueryValue(clientQuery, serverKey);
    if (Array.isArray(value)) {
      return clientQuery[0];
    }
    return value ?? null;
  }

  argumentFromServer(serverKey) {
    return this.data.argument[serverKey] ?? null;
  }

  linkFromServer(query) {
    const effectiveQuery = this.data.beforeLink(this, query);
    const queryString = this.queryFromServer(effectiveQuery);
    const clientPath = this.data.path;
    if (queryString === "") {
      return clientPath;
    } else {
      return clientPath + "?" + queryString;
    }
  }

  private queryFromServer(query: Record<string, string>) {
    const localized: Record<string, string> = {};
    for (const [key, value] of Object.entries(query)) {
      if (isEmpty(value)) {
        continue;
      }
      let queryName = this.data.query[key];
      // Since we can have 1:m mapping, we check and use the first value.
      if (Array.isArray(queryName)) {
        queryName = queryName[0];
      }
      localized[queryName] = value;
    }
    return querystring.stringify(localized);
  }

}

function asArray<Type>(value: Type | Type[] | undefined | null): Type[] {
  if (value === undefined || value === null) {
    return [];
  } else if (Array.isArray(value)) {
    return value;
  } else {
    return [value];
  }
}

function isEmpty<Type>(value: Type[] | string | undefined | null): boolean {
  if (value === null || value === undefined) {
    return true;
  } else if (Array.isArray(value)) {
    return value.length === 0;
  } else {
    return value === "";
  }
}
