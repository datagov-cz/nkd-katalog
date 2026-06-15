import {registerFacet} from "./facet.mjs";
import {registerFooter} from "./footer.mjs";
import {registerHead} from "./head.ts";
import {registerNavigation} from "./navigation.mjs";
import {registerPagination} from "./pagination.mjs";
import {registerResultBar} from "./result-bar.mjs";

export {createFacetData} from "./facet.mjs";
export {createFooterData} from "./footer.mjs";
export {createHeadData} from "./head.ts";
export {createNavigationData} from "./navigation.mjs";
export {createPaginationData} from "./pagination.mjs";
export {createResultBarData} from "./result-bar.mjs";

/**
 * @param {import('../service/template-service.ts').TemplateService} templateService
 * @param {string} language
 */
export function registerComponents(templateService, language) {
  registerFacet(templateService, language)
  registerFooter(templateService, language);
  registerHead(templateService);
  registerNavigation(templateService, language);
  registerPagination(templateService, language);
  registerResultBar(templateService);
}
