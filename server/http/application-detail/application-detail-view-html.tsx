import { FastifyReply } from "fastify";

import { ROUTE } from "../route-name.mjs";
import * as components from "../../component/index.mjs";
import { Head } from "../../component/head.tsx";
import { footerHtml } from "../../component/footer.ts";
import { headerHtml } from "../../component/header.ts";
import { renderToHtml } from "../../html/render-html.ts";
import { breakLines } from "../../html/escape.ts";
import type { NavigationEntry } from "../../service/navigation-service.ts";
import type { Language } from "../../localization/index.ts";
import type { ViewContext } from "../../service/view-context.ts";
import { Dl, DdLink, PropertiesColumn, RelatedItems } from "../../component/detail-parts.tsx";
import type {
  ApplicationDetailApplication,
  ApplicationDetailData,
  ApplicationDetailQuery,
  ApplicationDetailState,
  ApplicationDetailViewServices,
  CodelistItem,
} from "./application-detail-state.ts";

export function renderHtml(
  services: ApplicationDetailViewServices,
  languages: Language[],
  query: ApplicationDetailQuery,
  data: ApplicationDetailData | null,
  reply: FastifyReply,
): void {
  if (data == null) {
    services.http.handleNotFound(services, reply);
    return;
  }
  const state = prepareTemplateData(services, languages, query, data);
  const ctx: ViewContext = {
    t: services.translation.t,
    language: languages[0],
    navigation: services.navigation,
  };
  const html = renderApplicationDetailHtml(state, ctx);
  reply
    .code(200)
    .header("Content-Type", "text/html; charset=utf-8")
    .send(html);
}

export function prepareTemplateData(
  services: ApplicationDetailViewServices,
  languages: Language[],
  query: ApplicationDetailQuery,
  data: ApplicationDetailData,
): ApplicationDetailState {
  const language = languages[0];
  const datasets = data["datasets"];
  prepareDatasetsInPlace(services.navigation, data["datasets"]);
  const application = prepareApplication(services.navigation, language, data);
  return {
    "head": components.createHeadData(services.configuration),
    "application": application,
    "query": query,
    "datasets": {
      "visible": datasets.length > 0,
      "items": datasets,
    },
  };
}

function prepareDatasetsInPlace(
  navigation: NavigationEntry,
  datasets: ApplicationDetailData["datasets"],
) {
  const listNavigation = navigation.changeView(ROUTE.DATASET_DETAIL);
  for (const dataset of datasets) {
    dataset["href"] = listNavigation.linkFromServer({ "iri": dataset["iri"] });
  }
}

function prepareApplication(
  navigation: NavigationEntry,
  language: Language,
  application: ApplicationDetailData,
): ApplicationDetailApplication {
  const authorTitle = application["author"]["title"];
  const authorIri = application["author"]["iri"];

  updateCodelistInPlace(navigation, application["states"], "state");
  updateCodelistInPlace(navigation, application["themes"], "theme");
  updateCodelistInPlace(navigation, application["platforms"], "platform");
  updateCodelistInPlace(navigation, application["types"], "type");

  return {
    "author": {
      "title": authorTitle,
      "titleVisible": authorTitle !== null,
      "iri": authorIri,
      "iriVisible": authorIri !== null,
    },
    "title": application["title"],
    "description": application["description"],
    "states": application["states"],
    "themes": application["themes"],
    "platforms": application["platforms"],
    "types": application["types"],
    "published": formatDate(language, application["published"]),
    "modified": formatDate(language, application["modified"]),
    "link": application["link"],
  }
}

function formatDate(language: Language, value: Date | null): string {
  if (value === null) {
    return "-";
  }
  return value.toLocaleDateString(language);
}

function updateCodelistInPlace(
  navigation: NavigationEntry,
  items: CodelistItem[],
  name: string,
) {
  const listNavigation = navigation.changeView(ROUTE.APPLICATION_LIST);
  for (const item of items) {
    item["href"] = listNavigation.linkFromServer({ [name]: item["iri"] });
  }
}

// -- View -----------------------------------------------------------------

export function renderApplicationDetailHtml(
  state: ApplicationDetailState,
  ctx: ViewContext,
): string {
  return `<!DOCTYPE html>
  <html dir="ltr" lang="${ctx.language}">
  <head>${renderToHtml(<ApplicationDetailHead state={state} ctx={ctx} />)}</head>
  <body>
    <div class="gov-story-theme-scope">
      ${headerHtml(ctx.navigation, ctx.language, state.query)}
      ${renderToHtml(<ApplicationDetailMain state={state} ctx={ctx} />)}
      ${footerHtml(ctx.language)}
    </div>
  </body>
  </html>`;
}

function ApplicationDetailHead({ state, ctx }: {
  state: ApplicationDetailState,
  ctx: ViewContext,
}) {
  return (
    <>
      <Head state={state.head} />
      <title>{ctx.t("page-title")}</title>
      <meta name="description" content={ctx.t("page-description")} />
      <link rel="canonical" href="/application" />
      <link rel="alternate" href="/detail-aplikace" hreflang="cs" />
      <link rel="alternate" href="/application" hreflang="en" />
    </>
  );
}

function ApplicationDetailMain({ state, ctx }: {
  state: ApplicationDetailState,
  ctx: ViewContext,
}) {
  const app = state.application;
  const goToLink = ctx.t("go-to-link");
  return (
    <gov-container class="application-container">
      <div>
        {app.author.titleVisible ? (
          <>
            <h1>{app.title}</h1>
            <h2 class="inline">{app.author.title}</h2>
          </>
        ) : (
          <h1 class="inline">{app.title}</h1>
        )}
        {app.author.iriVisible ? (
          <a
            href={app.author.iri ?? ""}
            title={goToLink}
            rel="nofollow noopener noreferrer"
            target="_blank"
          >
            <gov-icon name="box-arrow-up-right" />
          </a>
        ) : null}
      </div>
      <br />
      <p dangerouslySetInnerHTML={{ __html: breakLines(app.description) }} />
      <gov-grid gap="l" class="gov-card-grid properties">
        <CodelistColumn term={ctx.t("dt-state")} items={app.states} goToLink={goToLink} />
        <CodelistColumn term={ctx.t("dt-theme")} items={app.themes} goToLink={goToLink} />
        <CodelistColumn term={ctx.t("dt-platform")} items={app.platforms} goToLink={goToLink} />
        <CodelistColumn term={ctx.t("dt-type")} items={app.types} goToLink={goToLink} />
        <PropertiesColumn>
          <Dl term={ctx.t("dt-published")}>
            <dd>{app.published}</dd>
          </Dl>
        </PropertiesColumn>
        <PropertiesColumn>
          <Dl term={ctx.t("dt-modified")}>
            <dd>{app.modified}</dd>
          </Dl>
        </PropertiesColumn>
      </gov-grid>
      <div>
        <gov-button
          color="primary"
          type="outlined"
          href={app.link ?? ""}
          expanded=""
          rel="nofollow noopener noreferrer"
        >
          {ctx.t("open-application")}
        </gov-button>
      </div>
      <br />
      {state.datasets.visible ? (
        <>
          <h2>{ctx.t("used-datasets")}</h2>
          <br />
          <RelatedItems items={state.datasets.items} />
        </>
      ) : null}
    </gov-container>
  );
}

function CodelistColumn({ term, items, goToLink }: {
  term: string,
  items: CodelistItem[],
  goToLink: string,
}) {
  return (
    <PropertiesColumn>
      <Dl term={term}>
        {items.map((item) => (
          <DdLink item={item} title={goToLink} />
        ))}
      </Dl>
    </PropertiesColumn>
  );
}
