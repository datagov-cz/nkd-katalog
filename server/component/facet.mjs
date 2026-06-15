import {DEFAULT_FACET_SIZE} from "../constants.mjs";

/**
 * @typedef {{
 *   iri: string,
 *   count: number,
 *   href: string,
 *   label?: string,
 *   active?: boolean,
 * }} FacetItemData
 *
 * @typedef {{
 *   label: string,
 *   count: number,
 *   items: FacetItemData[],
 *   tooltipMessage: string | undefined,
 *   showMoreHref?: string,
 *   showInitialHref?: string,
 * }} FacetData
 */

export function registerFacet(templateService, language) {
  templateService.syncAddComponent("facet", "facet-" + language + ".html");
}

/**
 * @param {import('../service/navigation-service.ts').NavigationEntry} navigationService
 * @param {any} query
 * @param {any[]} facetData
 * @param {string} facetName
 * @param {string} facetLabel
 * @param {string | undefined} tooltipMessage
 * @param {number} count
 * @returns {FacetData}
 */
export function createFacetData(navigationService, query, facetData, facetName, facetLabel, tooltipMessage, count) {
  facetData.forEach(item => prepareFacetItemInPlace(navigationService, facetName, query, item))
  const result = {
    "label": facetLabel,
    "count": count,
    "items": facetData,
    "tooltipMessage": tooltipMessage,
  };
  if (count > facetData.length) {
    result["showMoreHref"] = navigationService.linkFromServer({
      ...query,
      [facetName + "Limit"]: query[facetName + "Limit"] + DEFAULT_FACET_SIZE,
    });
  }
  if (DEFAULT_FACET_SIZE < facetData.length) {
    result["showInitialHref"] = navigationService.linkFromServer({
      ...query,
      [facetName + "Limit"]: DEFAULT_FACET_SIZE,
    });
  }
  return result;
}

function prepareFacetItemInPlace(navigationService, facetName, query, item) {
  const facetHref = [...query[facetName]];
  toggleItemInArray(facetHref, item["iri"])
  const nextQuery = {
    ...query,
    "page": 0,
    [facetName]: facetHref,
  }
  item["href"] = navigationService.linkFromServer(nextQuery);
}

function toggleItemInArray(items, value) {
  const index = items.indexOf(value);
  if (index === -1) {
    items.push(value);
  } else {
    items.splice(index, 1);
  }
}
