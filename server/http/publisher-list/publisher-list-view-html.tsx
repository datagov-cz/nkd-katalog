import { FastifyReply } from "fastify";

import { ROUTE } from "../route-name.mjs";
import { createHeadData } from "../../component/index.mjs";
import { Head } from "../../component/head.tsx";
import { headerHtml } from "../../component/header.ts";
import { footerHtml } from "../../component/footer.ts";
import { renderToHtml } from "../../html/render-html.ts";
import { SimpleListPage } from "../../component/simple-list-page.tsx";
import type { ViewContext } from "../../service/view-context.ts";
import type { Configuration } from "../../configuration.ts";
import type { NavigationEntry } from "../../service/navigation-service.ts";
import type { TranslationService } from "../../service/translation-service.ts";
import type { Language } from "../../localization/index.ts";
import type {
  PublisherListData,
  PublisherListPublisher,
  PublisherListState,
  PublisherListViewServices,
} from "./publisher-list-state.ts";

type ServerQuery = Record<string, string | string[]>;

export function renderHtml(
  services: PublisherListViewServices,
  languages: Language[],
  query: ServerQuery,
  data: PublisherListData,
  reply: FastifyReply,
): void {
  const state = prepareTemplateData(
    services.configuration,
    services.navigation,
    services.translation,
    languages,
    query,
    data,
  );
  const ctx: ViewContext = {
    t: services.translation.t,
    language: languages[0],
    navigation: services.navigation,
  };
  const html = renderPublisherListHtml(state, ctx);
  reply
    .code(200)
    .header("Content-Type", "text/html; charset=utf-8")
    .send(html);
}

export function prepareTemplateData(
  configuration: Configuration,
  navigation: NavigationEntry,
  translation: TranslationService,
  languages: Language[],
  query: ServerQuery,
  data: PublisherListData,
): PublisherListState {
  preparePublishersInPlace(
    configuration,
    navigation,
    translation,
    data["publishers"],
  );
  return {
    head: createHeadData(configuration),
    publishers: data["publishers"],
    query,
  };
}

function preparePublishersInPlace(configuration, navigation, translation, publishers) {
  const datasetListNavigation = navigation.changeView(ROUTE.DATASET_LIST);
  for (const publisher of publishers) {
    publisher["href"] = datasetListNavigation.linkFromServer({
      "publisher": publisher["iri"],
    });
    publisher["dashboardDaily"] =
      configuration.client.publisherDashboardDailyTemplate
        .replace("{}", publisher["iri"]);
    publisher["dashboardMonthly"] =
      configuration.client.publisherDashboardMonthlyTemplate
        .replace("{}", publisher["iri"]);
    publisher.message =
      translation.translate("datasets-found", publisher.count);
    //
    publisher.badges = {
      "vdf": publisher.vdfOriginator || publisher.vdfPublisher,
      "vdfOriginator": publisher.vdfOriginator,
      "vdfPublisher": publisher.vdfPublisher,
    };
  }
}

// -- View -------------------------------------------------------------------

export function renderPublisherListHtml(
  state: PublisherListState,
  ctx: ViewContext,
): string {
  return `<!DOCTYPE html>
  <html dir="ltr" lang="${ctx.language}">
  <head>${renderToHtml(<PublisherListHead state={state} ctx={ctx} />)}</head>
  <body>
    <div class="gov-story-theme-scope">
      ${headerHtml(ctx.navigation, ctx.language, state.query)}
      ${renderToHtml(<PublisherListMain state={state} ctx={ctx} />)}
      ${footerHtml(ctx.language)}
    </div>
  </body>
  </html>`;
}

function PublisherListHead({ state, ctx }: {
  state: PublisherListState,
  ctx: ViewContext,
}) {
  return (
    <>
      <Head state={state.head} />
      <title>{ctx.t("page-title")}</title>
      <meta name="description" content={ctx.t("page-description")} />
      <link rel="canonical" href="/publishers" />
      <link rel="alternate" href="/poskytovatelé" hreflang="cs" />
      <link rel="alternate" href="/publishers" hreflang="en" />
    </>
  );
}

function PublisherListMain({ state, ctx }: {
  state: PublisherListState,
  ctx: ViewContext,
}) {
  return (
    <SimpleListPage state={{
      heading: ctx.t("heading"),
      message: ctx.t("items-found", state.publishers.length),
      items: state.publishers,
      component: PublisherItem,
      layout: "list",
    }} ctx={ctx} />
  );
}

function PublisherItem({ value, ctx }: {
  value: PublisherListPublisher,
  ctx: ViewContext,
}) {
  const headlineId = "publisher-" + encodeURIComponent(value.iri);
  const badges = value.badges;
  return (
    <article>
      {/* No `href` on the card, as it contains links of its own. */}
      <gov-card direction="horizontal" aria-labelledby={headlineId}>
        <article>
          <gov-flex gap="s" direction="column">
            <header>
              <h3 id={headlineId} class="gov-card__headline">
                <a href={value.href}>{value.label}</a>
              </h3>
            </header>
            {!badges.vdf && !badges.vdfOriginator && !badges.vdfPublisher ? null : (
              <ul class="gov-tags gov-list--plain">
                {badges.vdf ? (
                  <li>
                    <gov-tag color="neutral" type="subtle" size="xs">VDF</gov-tag>
                  </li>
                ) : null}
                {badges.vdfOriginator ? (
                  <li>
                    <gov-tag color="neutral" type="subtle" size="xs">
                      {ctx.t("vdf-originator")}
                    </gov-tag>
                  </li>
                ) : null}
                {badges.vdfPublisher ? (
                  <li>
                    <gov-tag color="neutral" type="subtle" size="xs">
                      {ctx.t("vdf-publisher")}
                    </gov-tag>
                  </li>
                ) : null}
              </ul>
            )}
            <p>{value.message}</p>
            <gov-flex gap="xl">
              <a href={value.dashboardMonthly} title={ctx.t("dashboard-monthly")}>
                <gov-icon name="clipboard2-data" type="bootstrap" size="xl" />
              </a>
              <a href={value.dashboardDaily} title={ctx.t("dashboard-daily")}>
                <gov-icon name="clipboard2-pulse" type="bootstrap" size="xl" />
              </a>
            </gov-flex>
          </gov-flex>
        </article>
      </gov-card>
    </article>
  );
}
