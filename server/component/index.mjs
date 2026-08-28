import {registerFacet} from "./facet.mjs";
import {registerHead} from "./head.ts";
import {registerPagination} from "./pagination.mjs";
import {registerResultBar} from "./result-bar.mjs";
import {registerQuerySection} from "./query-section/index.ts";

export {createFacetData} from "./facet.mjs";
export {createHeadData} from "./head.ts";
export {createPaginationData} from "./pagination.mjs";
export {createResultBarData} from "./result-bar.mjs";
export * from "./query-section/index.ts";

/**
 * @param {import('../handlebars/index.ts').HandlebarsService} templateService
 * @param {string} language
 */
export function registerComponents(templateService, language) {
  registerFacet(templateService, language)
  registerHead(templateService);
  registerPagination(templateService, language);
  registerResultBar(templateService);
  registerQuerySection(templateService, language);
}
