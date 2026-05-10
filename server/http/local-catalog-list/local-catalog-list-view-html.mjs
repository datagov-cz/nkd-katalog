import { ROUTE } from "../route-name.mjs";
import * as components from "../../component/index.mjs";

export function renderHtml(services, languages, query, data, reply) {
  const templateData = prepareTemplateData(services, languages, query, data);
  const template = services.template.view(ROUTE.LOCAL_CATALOG_LIST);
  reply
    .code(200)
    .header("Content-Type", "text/html; charset=utf-8")
    .send(template(templateData));
}

export function prepareTemplateData(services, languages, query, data) {
  prepareCatalogsInPlace(services.configuration, services.link, services.translation, data["catalogs"])
  return {
    "head": components.createHeadData(services.configuration),
    "navigation": components.createNavigationData(services.navigation, languages, query, { localCatalogsActive: true }),
    "footer": components.createFooterData(),
    "message": services.translation.translate("items-found", data["catalogs"].length),
    "catalogs": data["catalogs"],
  };
}

function prepareCatalogsInPlace(configuration, link, translation, catalogs) {
  for (const catalog of catalogs) {
    catalog.url = link.wrapLink(catalog.iri);
    catalog.publisher.iri = link.wrapLink(catalog.publisher.iri);
    catalog.homepageUrl = catalog.homepage;
    catalog.endpointUrl = catalog.endpointURL;
    catalog.deleteUrl = configuration.client.catalogFormUrl
      + translation.translate("url-remove-link")
      + encodeURIComponent(catalog.iri);
    catalog.validateUrl = substituteToTemplate(
      configuration.client.catalogValidatorTemplate, catalog.endpointURL);
  }
}

function substituteToTemplate(template, url) {
  return template.replace("{}", encodeURIComponent(url));
}
