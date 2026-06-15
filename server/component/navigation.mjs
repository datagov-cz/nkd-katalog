/**
 * @typedef {{
 *   datasetsActive: boolean,
 *   applicationsActive: boolean,
 *   localCatalogsActive: boolean,
 *   suggestionsActive: boolean,
 *   publishersActive: boolean,
 *   [key: string]: string | boolean,
 * }} NavigationData
 */

export function registerNavigation(templateService, language) {
  templateService.syncAddComponent("navigation", "navigation-" + language + ".html");
}

/**
 * @param {import('../service/navigation-service.mjs').IViewBoundNavigation} navigationService
 * @param {string[]} languages
 * @param {any} query
 * @param {Record<string, boolean> | any} [options]
 * @returns {NavigationData}
 */
export function createNavigationData(
  navigationService, languages, query, options
) {
  // Create links for all languages.
  const result = {};
  for (const language of languages) {
    result[language] = navigationService.changeLanguage(language).linkFromServer(query);
  }
  return {
    //
    datasetsActive: false,
    applicationsActive: false,
    localCatalogsActive: false,
    suggestionsActive: false,
    publishersActive: false,
    //
    ...options,
    ...result
  };
}
