import configuration from "../configuration.ts";

/**
 * @typedef {{
 *   applicationRegistrationFormUrl: string | null,
 *   suggestionRegistrationFormUrl: string | null,
 *   catalogValidator: string | null,
 * }} FooterData
 */

/**
 * @param {import('../service/template-service.ts').TemplateService} templateService
 * @param {string} language
 */
export function registerFooter(templateService, language) {
  templateService.syncAddComponent("footer", "footer-" + language + ".html");
}

/**
 * @returns {FooterData}
 */
export function createFooterData() {
  return {
    "applicationRegistrationFormUrl": configuration.client.applicationFormUrl,
    "suggestionRegistrationFormUrl": configuration.client.suggestionFormUrl,
    "catalogValidator": configuration.client.catalogValidator,
  };
}
