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
  const html = renderApplicationDetailHtml(state, languages[0]);
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
  const dictionary = services.translation.dictionary;
  return {
    "head": components.createHeadData(services.configuration),
    "headerHtml": headerHtml(services.navigation, language, query),
    "footerHtml": footerHtml(language),
    "pageTitle": dictionary["page-title"],
    "pageDescription": dictionary["page-description"],
    "goToLink": dictionary["go-to-link"],
    "dtState": dictionary["dt-state"],
    "dtTheme": dictionary["dt-theme"],
    "dtPlatform": dictionary["dt-platform"],
    "dtType": dictionary["dt-type"],
    "dtPublished": dictionary["dt-published"],
    "dtModified": dictionary["dt-modified"],
    "openApplication": dictionary["open-application"],
    "usedDatasets": dictionary["used-datasets"],
    "application": application,
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
  language: "cs" | "en",
): string {
  const head = renderToHtml(<ApplicationDetailHead state={state} />);
  const main = renderToHtml(<ApplicationDetailMain state={state} />);
  return (
    "<!DOCTYPE html>\n" +
    `<html dir="ltr" lang="${language}">\n` +
    `<head>\n${head}\n</head>\n` +
    `<body>\n${state.headerHtml}\n${main}\n${state.footerHtml}\n</body>\n` +
    "</html>\n"
  );
}

function ApplicationDetailHead({ state }: { state: ApplicationDetailState }) {
  return (
    <>
      <Head state={state.head} />
      <title>{state.pageTitle}</title>
      <meta name="description" content={state.pageDescription} />
      <link rel="canonical" href="/application" />
      <link rel="alternate" href="/detail-aplikace" hreflang="cs" />
      <link rel="alternate" href="/application" hreflang="en" />
      <link
        type="text/css"
        rel="stylesheet"
        href="/assets/catalog/css/resource-list.css"
      />
      <link
        type="text/css"
        rel="stylesheet"
        href="/assets/catalog/css/resource-detail.css"
      />
    </>
  );
}

function ApplicationDetailMain({ state }: { state: ApplicationDetailState }) {
  const app = state.application;
  return (
    <gov-container class="application-container">
      <div>
        {app.author.titleVisible ? (
          <>
            <h1>{app.title}</h1>
            <h2 class="inline">
              {" "}
              {app.author.title}{" "}
            </h2>
          </>
        ) : (
          <h1 class="inline">{app.title}</h1>
        )}
        {app.author.iriVisible ? (
          <a
            href={app.author.iri ?? ""}
            title={state.goToLink}
            rel="nofollow noopener noreferrer"
            target="_blank"
          >
            <gov-icon name="box-arrow-up-right"></gov-icon>
          </a>
        ) : null}
      </div>
      <br />
      <p
        dangerouslySetInnerHTML={{
          __html: " " + breakLines(app.description) + " ",
        }}
      ></p>
      <gov-grid>
        <CodelistColumn term={state.dtState} items={app.states} goToLink={state.goToLink} />
        <CodelistColumn term={state.dtTheme} items={app.themes} goToLink={state.goToLink} />
        <CodelistColumn term={state.dtPlatform} items={app.platforms} goToLink={state.goToLink} />
        <CodelistColumn term={state.dtType} items={app.types} goToLink={state.goToLink} />
      </gov-grid>
      <gov-grid>
        <gov-grid-item size-sm="6/12" size-md="3/12">
          <dl>
            <dt>{state.dtPublished}</dt>
            <dd>{app.published}</dd>
          </dl>
        </gov-grid-item>
        <gov-grid-item size-sm="6/12" size-md="3/12">
          <dl>
            <dt>{state.dtModified}</dt>
            <dd>{app.modified}</dd>
          </dl>
        </gov-grid-item>
      </gov-grid>
      <div>
        <gov-button
          variant="primary"
          type="outlined"
          href={app.link ?? ""}
          expanded="true"
          rel="nofollow noopener noreferrer"
        >
          {" "}
          {state.openApplication}{" "}
        </gov-button>
      </div>
      <br />
      {state.datasets.visible ? (
        <>
          <h2>{state.usedDatasets}</h2>
          <br />
          <div class="resource-list">
            {state.datasets.items.map((dataset) => (
              <div class="resource-list-item">
                <a href={dataset.href ?? ""} rel="nofollow noopener noreferrer">
                  <h3>{dataset.title}</h3>
                </a>
                <p>
                  {" "}
                  {dataset.description}{" "}
                </p>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </gov-container>
  );
}

function CodelistColumn({
  term,
  items,
  goToLink,
}: {
  term: string;
  items: CodelistItem[];
  goToLink: string;
}) {
  return (
    <gov-grid-item size-sm="6/12" size-md="3/12">
      <dl>
        <dt>{term}</dt>
        {items.map((item) => (
          <dd>
            <a href={item.href ?? ""}>
              {" "}
              {item.label}{" "}
            </a>
            {" "}
            <a
              href={item.iri ?? ""}
              title={goToLink}
              rel="nofollow noopener noreferrer"
              target="_blank"
            >
              <gov-icon name="box-arrow-up-right"></gov-icon>
            </a>
          </dd>
        ))}
      </dl>
    </gov-grid-item>
  );
}
