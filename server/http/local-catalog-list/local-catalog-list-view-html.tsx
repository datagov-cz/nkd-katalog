import { FastifyReply } from "fastify";

import { createHeadData } from "../../component/index.mjs";
import { Head } from "../../component/head.tsx";
import { headerHtml } from "../../component/header.ts";
import { footerHtml } from "../../component/footer.ts";
import { renderToHtml } from "../../html/render-html.ts";
import { SimpleListPage } from "../../component/simple-list-page.tsx";
import type { ViewContext } from "../../service/view-context.ts";
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
  const state = prepareTemplateData(services, query, data);
  const ctx: ViewContext = {
    t: services.translation.t,
    language: languages[0],
    navigation: services.navigation,
  };
  const html = renderLocalCatalogListHtml(state, ctx);
  reply
    .code(200)
    .header("Content-Type", "text/html; charset=utf-8")
    .send(html);
}

export function prepareTemplateData(
  services: LocalCatalogListViewServices,
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
    catalogs: data["catalogs"],
    query,
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
  ctx: ViewContext,
): string {
  return `<!DOCTYPE html>
  <html dir="ltr" lang="${ctx.language}">
  <head>${renderToHtml(<LocalCatalogListHead state={state} ctx={ctx} />)}</head>
  <body>
    <div class="gov-story-theme-scope">
      ${headerHtml(ctx.navigation, ctx.language, state.query)}
      ${renderToHtml(<LocalCatalogListMain state={state} ctx={ctx} />)}
      ${footerHtml(ctx.language)}
    </div>
  </body>
  </html>`;
}

function LocalCatalogListHead({ state, ctx }: {
  state: LocalCatalogListState,
  ctx: ViewContext,
}) {
  return (
    <>
      <Head state={state.head} />
      <title>{ctx.t("page-title")}</title>
      <meta name="description" content={ctx.t("page-description")} />
      <link rel="canonical" href="/local-catalogs" />
      <link rel="alternate" href="/lokální-katalogy" hreflang="cs" />
      <link rel="alternate" href="/local-catalogs" hreflang="en" />
    </>
  );
}

function LocalCatalogListMain({ state, ctx }: {
  state: LocalCatalogListState,
  ctx: ViewContext,
}) {
  return (
    <SimpleListPage state={{
      heading: ctx.t("heading"),
      message: ctx.t("items-found", state.catalogs.length),
      items: state.catalogs,
      component: CatalogItem,
      layout: "list",
    }} ctx={ctx} />
  );
}

function CatalogItem({ value, ctx }: {
  value: LocalCatalogListCatalog,
  ctx: ViewContext,
}) {
  const headlineId = "catalog-" + encodeURIComponent(value.iri);
  return (
    <article>
      {/* No `href` on the card, as it contains links of its own. */}
      <gov-card direction="horizontal" aria-labelledby={headlineId}>
        <article>
          <gov-flex gap="s" direction="column">
            <header>
              <h3 id={headlineId} class="gov-card__headline">
                <a href={value.url ?? ""}>{value.title}</a>
              </h3>
            </header>
            <p>
              <a href={value.publisher.iri ?? ""}>{value.publisher.label}</a>
            </p>
            <p>
              <a href={mailtoUrl(value.contactPoint.email)}>
                <gov-icon name="envelope" size="xl" className="align-text-bottom" />
                {value.contactPoint.name}
              </a>
            </p>
            <gov-flex gap="xl">
              <a href={value.homepageUrl} title={ctx.t("homepage-link")}>
                <gov-icon name="house-door-fill" size="xl" />
              </a>
              <a href={value.endpointUrl} title={ctx.t("endpoint-link")}>
                <gov-icon name="link-45deg" type="bootstrap" size="xl" />
              </a>
              <a href={value.validateUrl} title={ctx.t("validate-link")}>
                <gov-icon name="communication" type="complex" size="xl" />
              </a>
              <a href={value.deleteUrl} title={ctx.t("delete-link")}>
                <gov-icon name="trash" type="bootstrap" size="xl" />
              </a>
            </gov-flex>
          </gov-flex>
        </article>
      </gov-card>
    </article>
  );
}

/** The stored contact value may or may not include the `mailto:` scheme. */
function mailtoUrl(email: string | null | undefined): string {
  if (!email) {
    return "";
  }
  return email.startsWith("mailto:") ? email : "mailto:" + email;
}
