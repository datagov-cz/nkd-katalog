/**
 * @typedef {{
 *   visible: boolean,
 *   total: number,
 *   pageSize: number,
 *   currentPage: number,
 *   linkTemplate: string,
 *   pageSizeHref: string,
 * }} PaginationData
 */

export function registerPagination(templateService, language) {
  templateService.syncAddComponent("pagination", "pagination-" + language + ".html");
}

/**
 * @param {import('../service/navigation-service.mjs').IViewBoundNavigation} navigation
 * @param {any} query
 * @param {number} documentsCount
 * @returns {PaginationData}
 */
export function createPaginationData(navigation, query, documentsCount) {
  return {
    "visible": documentsCount > query.pageSize,
    "total": documentsCount,
    "pageSize": query.pageSize,
    "currentPage": query.page + 1,
    "linkTemplate": navigation.linkFromServer({
      ...query,
      "page": "_PAGE_"
    }).replace("_PAGE_", "{PAGE}"), // We need '{PAGE}' in link template for design-system.
    "pageSizeHref": navigation.linkFromServer({
      ...query,
      "page": 0,
      "pageSize": "_PAGE_SIZE_"
    })
  }
}
