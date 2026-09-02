import { FastifyReply } from "fastify";

import { createHeadData } from "../../component/index.mjs";
import { Head } from "../../component/head.tsx";
import { headerHtml } from "../../component/header.ts";
import { footerHtml } from "../../component/footer.ts";
import { renderToHtml } from "../../html/render-html.ts";
import type { Language } from "../../localization/index.ts";
import type {
  LocalCatalogListCatalog,
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
  const state = prepareTemplateData(services, languages, query, data);
  const html = renderLocalCatalogListHtml(state, languages[0]);
  reply
    .code(200)
    .header("Content-Type", "text/html; charset=utf-8")
    .send(html);
}

export function prepareTemplateData(
  services: LocalCatalogListViewServices,
  languages: Language[],
  query: ServerQuery,
  data: LocalCatalogListData,
): LocalCatalogListState {
  const { translation } = services;
  prepareCatalogsInPlace(
    services.configuration,
    services.link,
    translation,
    data["catalogs"],
  );
  return {
    head: createHeadData(services.configuration),
    headerHtml: headerHtml(services.navigation, languages[0], query),
    footerHtml: footerHtml(languages[0]),
    pageTitle: translation.dictionary["page-title"],
    pageDescription: translation.dictionary["page-description"],
    heading: translation.dictionary["heading"],
    homepageLink: translation.dictionary["homepage-link"],
    endpointLink: translation.dictionary["endpoint-link"],
    deleteLink: translation.dictionary["delete-link"],
    validateLink: translation.dictionary["validate-link"],
    message: translation.translate("items-found", data["catalogs"].length),
    catalogs: data["catalogs"],
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

// -- View -----------------------------------------------------------------

export function renderLocalCatalogListHtml(
  state: LocalCatalogListState,
  language: "cs" | "en",
): string {
  const head = renderToHtml(<LocalCatalogListHead state={state} />);
  const main = renderToHtml(<LocalCatalogListMain state={state} />);
  return (
    "<!DOCTYPE html>\n" +
    `<html dir="ltr" lang="${language}">\n` +
    `<head>\n${head}\n</head>\n` +
    `<body>\n${state.headerHtml}\n${main}\n<br/>\n${state.footerHtml}\n</body>\n` +
    "</html>\n"
  );
}

function LocalCatalogListHead({ state }: { state: LocalCatalogListState }) {
  return (
    <>
      <Head state={state.head} />
      <title>{state.pageTitle}</title>
      <meta name="description" content={state.pageDescription} />
      <link rel="canonical" href="/local-catalogs" />
      <link rel="alternate" href="/lokální-katalogy" hreflang="cs" />
      <link rel="alternate" href="/local-catalogs" hreflang="en" />
      <link
        type="text/css"
        rel="stylesheet"
        href="/assets/catalog/css/catalog-list.css"
      />
    </>
  );
}

function LocalCatalogListMain({ state }: { state: LocalCatalogListState }) {
  return (
    <gov-container class="catalogs-container">
      <br />
      <h1>{state.heading}</h1>
      <p>
        {" "}
        {state.message}{" "}
      </p>
      <gov-grid>
        {state.catalogs.map((catalog) => (
          <CatalogCard catalog={catalog} state={state} />
        ))}
      </gov-grid>
    </gov-container>
  );
}

function CatalogCard({
  catalog,
  state,
}: {
  catalog: LocalCatalogListCatalog;
  state: LocalCatalogListState;
}) {
  return (
    <gov-grid-item
      size-sm="12/12"
      size-md="6/12"
      size-lg="4/12"
      size-xl="3/12"
      class="p-1"
    >
      <gov-card>
        <div class="gov-card__header">
          <a href={catalog.publisher.iri ?? ""}>
            <h3 class="gov-card__title inline">{catalog.publisher.label}</h3>
            <gov-icon name="box-arrow-up-right"></gov-icon>
          </a>
        </div>
        <div class="gov-card__inner grow">
          <div class="gov-card__main">
            <div>
              {" "}
              {catalog.title}{" "}
              <a href={catalog.url ?? ""}>
                <gov-icon name="box-arrow-up-right"></gov-icon>
              </a>
            </div>
            <div>
              <a href={catalog.contactPoint.email ?? ""}>
                <gov-icon name="envelope"></gov-icon>
                {" "}
                {catalog.contactPoint.name}{" "}
              </a>
            </div>
          </div>
          <div
            class="gov-card__footer flex-space-evenly"
            style="font-size: x-large;"
          >
            <a href={catalog.homepageUrl ?? ""} title={state.homepageLink}>
              <gov-icon name="house-door-fill"></gov-icon>
            </a>
            <a href={catalog.endpointUrl ?? ""} title={state.endpointLink}>
              <gov-icon name="link-45deg"></gov-icon>
            </a>
            <a href={catalog.deleteUrl ?? ""} title={state.deleteLink}>
              <gov-icon name="trash"></gov-icon>
            </a>
            <a href={catalog.validateUrl ?? ""} title={state.validateLink}>
              <gov-icon name="communication" type="complex"></gov-icon>
            </a>
          </div>
        </div>
      </gov-card>
    </gov-grid-item>
  );
}
