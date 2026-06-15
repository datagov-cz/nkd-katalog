/**
 * @typedef {{ wrapLink: (url: string) => string }} LinkService
 */

/**
 * Objective of link service is to update links to external resources.
 * Those may include links to publishers, catalogs, and datasets.
 * @param {import('../configuration.ts').Configuration} configuration
 * @returns {LinkService}
 */
export function createLinkService(configuration) {
  const template = configuration.client.dereferenceTemplate;
  let wrapLink;
  if (template === "") {
    wrapLink = pass;
  } else {
    wrapLink = (url) => substituteToTemplate(template, url);
  }
  return {
    /**
     * Given URL of a resource may wrap it using CLIENT_DEREFERENCE
     * configuration.
     * @param {string} url
     * @returns {string}
     */
    "wrapLink": wrapLink,
  };
}

/**
 * @param {string} url
 * @returns {string}
 */
function pass(url) {
  return url;
}

/**
 * @param {string} template
 * @param {string} url
 * @returns {string}
 */
function substituteToTemplate(template, url) {
  return template.replace("{}", encodeURIComponent(url));
}
