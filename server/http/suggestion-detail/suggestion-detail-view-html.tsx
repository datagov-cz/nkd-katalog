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
import type { ViewContext } from "../../service/view-context.ts";
import { Dl, DdLink, PropertiesColumn, RelatedItems } from "../../component/detail-parts.tsx";
import type {
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
  const ctx: ViewContext = {
    t: services.translation.t,
    language: languages[0],
    navigation: services.navigation,
  };
  const html = renderSuggestionDetailHtml(state, ctx);
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
  return {
    "head": components.createHeadData(services.configuration),
    "suggestion": suggestion,
    "query": query,
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
  updateCodelistInPlace(navigation, suggestion["source"], "source");
  return {
    "iri": suggestion["iri"],
    "title": suggestion["title"],
    "description": suggestion["description"],
    "themes": suggestion["themes"],
    "state": suggestion["state"],
    "source": suggestion["source"],
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
  ctx: ViewContext,
): string {
  return `<!DOCTYPE html>
  <html dir="ltr" lang="${ctx.language}">
  <head>${renderToHtml(<SuggestionDetailHead state={state} ctx={ctx} />)}</head>
  <body>
    <div class="gov-story-theme-scope">
      ${headerHtml(ctx.navigation, ctx.language, state.query)}
      ${renderToHtml(<SuggestionDetailMain state={state} ctx={ctx} />)}
      ${footerHtml(ctx.language)}
    </div>
  </body>
  </html>`;
}

function SuggestionDetailHead({ state, ctx }: {
  state: SuggestionDetailState,
  ctx: ViewContext,
}) {
  return (
    <>
      <Head state={state.head} />
      <title>{ctx.t("page-title")}</title>
      <meta name="description" content={ctx.t("page-description")} />
      <link rel="canonical" href="/suggestion-for-dataset-to-be-opened" />
      <link rel="alternate" href="/návrh-na-datovou-sadu-k-otevření" hreflang="cs" />
      <link rel="alternate" href="/suggestion-for-dataset-to-be-opened" hreflang="en" />
    </>
  );
}

function SuggestionDetailMain({ state, ctx }: {
  state: SuggestionDetailState,
  ctx: ViewContext,
}) {
  const suggestion = state.suggestion;
  const goToLink = ctx.t("go-to-link");
  const yesNo = (value: boolean) => ctx.t(value ? "yes" : "no");
  return (
    <gov-container class="suggestion-container">
      <div>
        <h1>{suggestion.title}</h1>
        <h2 class="inline">{suggestion.publisher.title}</h2>
        <a
          href={suggestion.publisher.iri ?? ""}
          title={goToLink}
          rel="nofollow noopener noreferrer"
          target="_blank"
        >
          <gov-icon name="box-arrow-up-right" />
        </a>
      </div>
      <br />
      <p dangerouslySetInnerHTML={{ __html: breakLines(suggestion.description) }} />
      <gov-grid gap="l" class="gov-card-grid properties">
        <PropertiesColumn>
          <Dl term={ctx.t("dt-theme")}>
            {suggestion.themes.map((item) => (
              <DdLink item={item} title={goToLink} />
            ))}
          </Dl>
        </PropertiesColumn>
        <PropertiesColumn>
          <Dl term={ctx.t("dt-created")}>
            <dd>{suggestion.created}</dd>
          </Dl>
        </PropertiesColumn>
        <PropertiesColumn>
          <Dl term={ctx.t("dt-state")}>
            <dd>{suggestion.state?.label}</dd>
          </Dl>
        </PropertiesColumn>
        <PropertiesColumn>
          <Dl term={ctx.t("dt-source")}>
            {suggestion.source.map((item) => (
              <DdLink item={item} title={goToLink} />
            ))}
          </Dl>
        </PropertiesColumn>
        {suggestion.publication_plan_visible ? (
          <PropertiesColumn>
            <Dl term={ctx.t("dt-publication-plan")}>
              <dd>{suggestion.publication_plan}</dd>
            </Dl>
          </PropertiesColumn>
        ) : null}
        <PropertiesColumn>
          <Dl term={ctx.t("dt-mandatory-106")}>
            <dd>{yesNo(suggestion.mandatory_106)}</dd>
          </Dl>
        </PropertiesColumn>
        <PropertiesColumn>
          <Dl term={ctx.t("dt-obstacle-special")}>
            <dd>{yesNo(suggestion.obstacle_special_regulation)}</dd>
          </Dl>
        </PropertiesColumn>
        <PropertiesColumn>
          <Dl term={ctx.t("dt-obstacle-106")}>
            <dd>{yesNo(suggestion.obstacle_106)}</dd>
          </Dl>
        </PropertiesColumn>
      </gov-grid>
      <br />
      {state.datasets.visible ? (
        <>
          <h2>{ctx.t("h2-datasets")}</h2>
          <br />
          <RelatedItems items={state.datasets.items} />
        </>
      ) : null}
    </gov-container>
  );
}
