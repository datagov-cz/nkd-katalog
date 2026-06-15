import {DEFAULT_FACET_SIZE, DEFAULT_PAGE_SIZE} from "../../constants.mjs";

const SORT_OPTIONS = ["title", "created"]

const SORT_DIRECTION_OPTIONS = ["asc", "desc"];

const DEFAULT_SORT = "title";

const DEFAULT_SORT_DIRECTION = "asc";

const DEFAULT_PAGE = 0;

/**
 * @param {import('../../service/navigation-service.ts').NavigationEntry} navigation
 * @param {Record<string, string | string[]>} query
 * @returns {any}
 */
export function parseClientQuery(navigation, query) {
  const clientSort = navigation.queryArgumentFromClient(query, "sort");
  const sort = selectArgumentFromClientQueryOrDefault(
    navigation, SORT_OPTIONS, clientSort,
    DEFAULT_SORT);

  const clientSortDirection = navigation.queryArgumentFromClient(
    query, "sort-direction");
  const sortDirection = selectArgumentFromClientQueryOrDefault(
    navigation, SORT_DIRECTION_OPTIONS, clientSortDirection,
    DEFAULT_SORT_DIRECTION);

  const page = navigation.queryArgumentFromClient(query, "page");
  const pageSize = navigation.queryArgumentFromClient(query, "page-size");
  const themeLimit = navigation.queryArgumentFromClient(query, "theme-limit");
  const publisherLimit = navigation.queryArgumentFromClient(query, "publisher-limit");
  const stateLimit = navigation.queryArgumentFromClient(query, "state-limit");

  return {
    "searchQuery": navigation.queryArgumentFromClient(query, "query"),
    "theme": navigation.queryArgumentArrayFromClient(query, "theme"),
    "themeLimit": asPositiveNumber(themeLimit, DEFAULT_FACET_SIZE),
    "publisher": navigation.queryArgumentArrayFromClient(query, "publisher"),
    "publisherLimit": asPositiveNumber(publisherLimit, DEFAULT_FACET_SIZE),
    "state": navigation.queryArgumentArrayFromClient(query, "state"),
    "stateLimit": asPositiveNumber(stateLimit, DEFAULT_FACET_SIZE),
    "sort": sort,
    "sortDirection": sortDirection,
    "page": asPositiveNumber(page, 1) - 1,
    "pageSize": asPositiveNumber(pageSize, DEFAULT_PAGE_SIZE),
  };
}

function selectArgumentFromClientQueryOrDefault(
  navigation, options, clientValue, defaultValue
) {
  for (const value of options) {
    const valueAsClient = navigation.argumentFromServer(value);
    if (valueAsClient == clientValue) {
      return value;
    }
  }
  return defaultValue;
}

function asPositiveNumber(value, defaultValue) {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  let result = parseInt(value,10);
  if (isNaN(result)) {
    return defaultValue;
  } else {
    return Math.max(1, result);
  }
}

/**
 * @param {import('../../service/navigation-service.ts').NavigationEntry} navigation
 * @param {any} serverQuery
 * @returns {Record<string, any>}
 */
export function beforeLinkCallback(navigation, serverQuery) {
  const result = {};
  setIfNotEmpty(result, "query", serverQuery.searchQuery);
  setIfNotEmpty(result, "theme", serverQuery.theme);
  setIfNotDefault(result, "theme-limit", serverQuery.themeLimit, DEFAULT_FACET_SIZE);
  setIfNotEmpty(result, "publisher", serverQuery.publisher);
  setIfNotDefault(result, "publisher-limit", serverQuery.publisherLimit, DEFAULT_FACET_SIZE);
  setIfNotEmpty(result, "state", serverQuery.state);
  setIfNotDefault(result, "state-limit", serverQuery.stateLimit, DEFAULT_FACET_SIZE);
  if (serverQuery.sort !== DEFAULT_SORT) {
    result["sort"] = navigation.argumentFromServer(serverQuery.sort);
  }
  if (serverQuery.sortDirection !== DEFAULT_SORT_DIRECTION) {
    result["sort-direction"] = navigation.argumentFromServer(serverQuery.sortDirection);
  }
  setIfNotDefault(result, "page", serverQuery.page, DEFAULT_PAGE);
  setIfNotDefault(result, "page-size", serverQuery.pageSize, DEFAULT_PAGE_SIZE);
  return result;
}

function setIfNotDefault(query, key, value, defaultValue) {
  if (value === undefined || value === null || value === defaultValue) {
    return;
  }
  query[key] = value;
}

function setIfNotEmpty(query, key, value) {
  if (value === undefined || value === null || value.length === 0) {
    return;
  }
  query[key] = value;
}

