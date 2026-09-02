import { FastifyReply } from "fastify";

import { ROUTE } from "../route-name.mjs";
import * as components from "../../component/index.mjs";
import { Head } from "../../component/head.tsx";
import { headerHtml } from "../../component/header.ts";
import { footerHtml } from "../../component/footer.ts";
import { renderToHtml } from "../../html/render-html.ts";
import { breakLines } from "../../html/escape.ts";
import type { NavigationEntry } from "../../service/navigation-service.ts";
import type { Language } from "../../localization/index.ts";
import type {
  CodelistItem,
  SuggestionDetailData,
  SuggestionDetailQuery,
  SuggestionDetailState,
  SuggestionDetailSuggestion,
  SuggestionDetailViewServices,
} from "./suggestion-detail-state.ts";

export function renderHtml(
  services: SuggestionDetailViewServices,
  languages: Language[],
  query: SuggestionDetailQuery,
  data: SuggestionDetailData | null,
  reply: FastifyReply,
): void {
  if (data == null) {
    services.http.handleNotFound(services, reply);
    return;
  }
  const state = prepareTemplateData(services, languages, query, data);
  const html = renderSuggestionDetailHtml(state, languages[0]);
  reply
    .code(200)
    .header("Content-Type", "text/html; charset=utf-8")
    .send(html);
}

export function prepareTemplateData(
  services: SuggestionDetailViewServices,
  languages: Language[],
  query: SuggestionDetailQuery,
  data: SuggestionDetailData,
): SuggestionDetailState {
  const language = languages[0];
  const datasets = data["datasets"];
  prepareDatasetsInPlace(services, data["datasets"]);
  const suggestion = prepareSuggestion(services.navigation, language, data);
  const dictionary = services.translation.dictionary;
  return {
    "head": components.createHeadData(services.configuration),
    "headerHtml": headerHtml(services.navigation, language, query),
    "footerHtml": footerHtml(language),
    "pageTitle": dictionary["page-title"],
    "pageDescription": dictionary["page-description"],
    "goToLink": dictionary["go-to-link"],
    "dtTheme": dictionary["dt-theme"],
    "dtCreated": dictionary["dt-created"],
    "dtState": dictionary["dt-state"],
    "dtPublicationPlan": dictionary["dt-publication-plan"],
    "dtMandatory106": dictionary["dt-mandatory-106"],
    "dtObstacleSpecial": dictionary["dt-obstacle-special"],
    "dtObstacle106": dictionary["dt-obstacle-106"],
    "yes": dictionary["yes"],
    "no": dictionary["no"],
    "h2Datasets": dictionary["h2-datasets"],
    "suggestion": suggestion,
    "datasets": {
      "visible": datasets.length > 0,
      "items": datasets,
    },
  };
}

function prepareDatasetsInPlace(services, datasets) {
  const listNavigation = services.navigation.changeView(ROUTE.DATASET_DETAIL);
  for (const dataset of datasets) {
    dataset["href"] = listNavigation.linkFromServer({ "iri": dataset["iri"] });
  }
}

function prepareSuggestion(
  navigation: NavigationEntry,
  language: Language,
  suggestion: SuggestionDetailData,
): SuggestionDetailSuggestion {
  updateCodelistInPlace(navigation, suggestion["themes"], "theme");
  return {
    "iri": suggestion["iri"],
    "title": suggestion["title"],
    "description": suggestion["description"],
    "themes": suggestion["themes"],
    "state": suggestion["state"],
    "created": formatDate(language, suggestion["created"]),
    "mandatory_106": suggestion["mandatory_106"],
    "obstacle_special_regulation": suggestion["obstacle_special_regulation"],
    "obstacle_106": suggestion["obstacle_106"],
    "publisher": {
      "iri": suggestion["publisher"]["iri"],
      "title": suggestion["publisher"]["title"],
    },
    "publication_plan": suggestion["publication_plan"],
    "publication_plan_visible": isNotEmpty(suggestion["publication_plan"]),
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
  items: { iri: string; href?: string }[],
  name: string,
) {
  const listNavigation = navigation.changeView(ROUTE.SUGGESTION_LIST);
  for (const item of items) {
    item["href"] = listNavigation.linkFromServer({ [name]: item["iri"] });
  }
}

function isNotEmpty(value: string | null | undefined): boolean {
  return value !== undefined && value !== null && value !== "";
}

// -- View -----------------------------------------------------------------

export function renderSuggestionDetailHtml(
  state: SuggestionDetailState,
  language: "cs" | "en",
): string {
  const head = renderToHtml(<SuggestionDetailHead state={state} />);
  const main = renderToHtml(<SuggestionDetailMain state={state} />);
  return (
    "<!DOCTYPE html>\n" +
    `<html dir="ltr" lang="${language}">\n` +
    `<head>\n${head}\n</head>\n` +
    `<body>\n${state.headerHtml}\n${main}\n${state.footerHtml}\n</body>\n` +
    "</html>\n"
  );
}

function SuggestionDetailHead({ state }: { state: SuggestionDetailState }) {
  return (
    <>
      <Head state={state.head} />
      <title>{state.pageTitle}</title>
      <meta name="description" content={state.pageDescription} />
      <link rel="canonical" href="/suggestion-for-dataset-to-be-opened" />
      <link
        rel="alternate"
        href="/návrh-na-datovou-sadu-k-otevření"
        hreflang="cs"
      />
      <link
        rel="alternate"
        href="/suggestion-for-dataset-to-be-opened"
        hreflang="en"
      />
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

function SuggestionDetailMain({ state }: { state: SuggestionDetailState }) {
  const suggestion = state.suggestion;
  return (
    <gov-container class="suggestion-container">
      <div>
        <h1>{suggestion.title}</h1>
        <h2 class="inline">
          {" "}
          {suggestion.publisher.title}{" "}
        </h2>
        <a
          href={suggestion.publisher.iri ?? ""}
          title={state.goToLink}
          rel="nofollow noopener noreferrer"
          target="_blank"
        >
          <gov-icon name="box-arrow-up-right"></gov-icon>
        </a>
      </div>
      <br />
      <p
        dangerouslySetInnerHTML={{
          __html: " " + breakLines(suggestion.description) + " ",
        }}
      ></p>
      <gov-grid>
        <gov-grid-item size-sm="6/12" size-md="3/12">
          <dl>
            <dt>{state.dtTheme}</dt>
            {suggestion.themes.map((item) => (
              <ThemeDd item={item} goToLink={state.goToLink} />
            ))}
          </dl>
        </gov-grid-item>
        <gov-grid-item size-sm="6/12" size-md="3/12">
          <dl>
            <dt>{state.dtCreated}</dt>
            <dd>{suggestion.created}</dd>
          </dl>
        </gov-grid-item>
        <gov-grid-item size-sm="6/12" size-md="3/12">
          <dl>
            <dt>{state.dtState}</dt>
            <dd>{suggestion.state?.label}</dd>
          </dl>
        </gov-grid-item>
        {suggestion.publication_plan_visible ? (
          <gov-grid-item size-sm="6/12" size-md="3/12">
            <dl>
              <dt>{state.dtPublicationPlan}</dt>
              <dd>{suggestion.publication_plan}</dd>
            </dl>
          </gov-grid-item>
        ) : null}
      </gov-grid>
      <gov-grid>
        <gov-grid-item size-sm="6/12" size-md="3/12">
          <dl>
            <dt>{state.dtMandatory106}</dt>
            <dd>{suggestion.mandatory_106 ? state.yes : state.no}</dd>
          </dl>
        </gov-grid-item>
        <gov-grid-item size-sm="6/12" size-md="3/12">
          <dl>
            <dt>{state.dtObstacleSpecial}</dt>
            <dd>
              {suggestion.obstacle_special_regulation ? state.yes : state.no}
            </dd>
          </dl>
        </gov-grid-item>
        <gov-grid-item size-sm="6/12" size-md="3/12">
          <dl>
            <dt>{state.dtObstacle106}</dt>
            <dd>{suggestion.obstacle_106 ? state.yes : state.no}</dd>
          </dl>
        </gov-grid-item>
      </gov-grid>
      <br />
      {state.datasets.visible ? (
        <>
          <h2>{state.h2Datasets}</h2>
          <br />
          <div class="p-2 resource-list">
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

function ThemeDd({ item, goToLink }: { item: CodelistItem; goToLink: string }) {
  return (
    <dd>
      <a href={item.href ?? ""}>
        {" "}
        {item.label}{" "}
      </a>
      {" "}
      <a
        href={item.iri ?? ""}
        title={goToLink}
        rel="nofollow noopener noreferrer"
        target="_blank"
      >
        <gov-icon name="box-arrow-up-right"></gov-icon>
      </a>
    </dd>
  );
}
