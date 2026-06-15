/**
 * @typedef {{
 *   message: string,
 *   ordering: {
 *     active: string,
 *     items: Array<{ label: string, href: string }>,
 *   },
 * }} ResultBarData
 */

export function registerResultBar(templateService) {
  templateService.syncAddComponent("result-bar", "result-bar.html");
}

/**
 * @param {import('../service/translation-service.ts').TranslationService} translationService
 * @param {import('../service/navigation-service.mjs').IViewBoundNavigation} navigationService
 * @param {any} query
 * @param {string[][]} sortOptions
 * @param {number} itemsCount
 * @returns {ResultBarData}
 */
export function createResultBarData(translationService, navigationService, query, sortOptions, itemsCount) {
  return {
    "message": translationService.translate("items-found", itemsCount),
    "ordering": createOrderingForTemplate(translationService, navigationService, query, sortOptions),
  };
}

function createOrderingForTemplate(translation, navigation, query, sortOptions) {
  const activeSort = query["sort"];
  const activeDirection = query["sortDirection"];
  //
  const options = [];
  for (const [sort, direction] of sortOptions) {
    options.push({
      "label": createLabelForOrdering(translation, sort, direction),
      "href": navigation.linkFromServer({
        ...query,
        "page": 0,
        "sort": sort,
        "sortDirection": direction,
      }),
    });
  }
  //
  return {
    "active": navigation.linkFromServer({
      ...query,
      "sort": activeSort,
      "sortDirection": activeDirection,
    }),
    "items": options,
  };
}

function createLabelForOrdering(translation, sort, direction) {
  return translation.translate(sort) + " " + translation.translate(direction);
}
