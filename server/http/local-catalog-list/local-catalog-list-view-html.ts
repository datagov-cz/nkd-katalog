import { FastifyReply } from "fastify";

import { ROUTE } from "../route-name.mjs";
import * as components from "../../component/index.mjs";
import {headerHtml} from "../../component/header.ts";
import {footerHtml} from "../../component/footer.ts";
import type { Language } from "../../localization/index.ts";
import type {
  LocalCatalogListData,
  LocalCatalogListState,
  LocalCatalogListViewServices,
} from "./local-catalog-list-state.ts";

type ServerQuery = Record<string, string | string[]>;

export function renderHtml(
  services: LocalCatalogListViewServices,
  languages: Language[],
  query: ServerQuery,
  data: LocalCatalogListData,
  reply: FastifyReply,
): void {
  const templateData = prepareTemplateData(services, languages, query, data);
  const template = services.template.view(ROUTE.LOCAL_CATALOG_LIST);
  reply
    .code(200)
    .header("Content-Type", "text/html; charset=utf-8")
    .send(template(templateData));
}

export function prepareTemplateData(
  services: LocalCatalogListViewServices,
  languages: Language[],
  query: ServerQuery,
  data: LocalCatalogListData,
): LocalCatalogListState {
  prepareCatalogsInPlace(services.configuration, services.link, services.translation, data["catalogs"])
  return {
    "head": components.createHeadData(services.configuration),
    "headerHtml": headerHtml(services.navigation, languages[0], query),
    "footerHtml": footerHtml(languages[0]),
    "translation": services.translation.dictionary,
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
