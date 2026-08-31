import { FastifyReply } from "fastify";

import { ROUTE } from "../route-name.mjs";
import { createHeadData } from "../../component/index.mjs";
import { Head } from "../../component/head.tsx";
import { headerHtml } from "../../component/header.ts";
import { footerHtml } from "../../component/footer.ts";
import { renderToHtml } from "../../html/render-html.ts";
import { capture } from "../../capture/capture-manager.ts";
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
  const html = renderPublisherListHtml(state, languages[0]);
  capture.captureViewRender(ROUTE.PUBLISHER_LIST, state, html);
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
    headerHtml: headerHtml(navigation, languages[0], query),
    footerHtml: footerHtml(languages[0]),
    pageTitle: translation.dictionary["page-title"],
    pageDescription: translation.dictionary["page-description"],
    heading: translation.dictionary["heading"],
    dashboardMonthlyLabel: translation.dictionary["dashboard-monthly"],
    dashboardDailyLabel: translation.dictionary["dashboard-daily"],
    vdfOriginatorLabel: translation.dictionary["vdf-originator"],
    vdfPublisherLabel: translation.dictionary["vdf-publisher"],
    message: translation.translate("items-found", data["publishers"].length),
    publishers: data["publishers"],
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

/**
 * Full document as a string. The header and footer are pre-rendered HTML
 * fragments injected verbatim (as `{{{headerHtml}}}` / `{{{footerHtml}}}` did);
 * everything between them is JSX. The golden harness re-parses the whole
 * string, so the seams between the concatenated parts do not matter.
 */
export function renderPublisherListHtml(
  state: PublisherListState,
  language: "cs" | "en",
): string {
  const head = renderToHtml(<PublisherListHead state={state} />);
  const main = renderToHtml(<PublisherListMain state={state} />);
  return (
    "<!DOCTYPE html>\n" +
    `<html dir="ltr" lang="${language}">\n` +
    `<head>\n${head}\n</head>\n` +
    `<body>\n${state.headerHtml}\n${main}\n<br/>\n${state.footerHtml}\n</body>\n` +
    "</html>\n"
  );
}

function PublisherListHead({ state }: { state: PublisherListState }) {
  return (
    <>
      <Head state={state.head} />
      <title>{state.pageTitle}</title>
      <meta name="description" content={state.pageDescription} />
      <link rel="canonical" href="/publishers" />
      <link rel="alternate" href="/poskytovatelé" hreflang="cs" />
      <link rel="alternate" href="/publishers" hreflang="en" />
      <link
        type="text/css"
        rel="stylesheet"
        href="/assets/catalog/css/publisher-list.css"
      />
    </>
  );
}

function PublisherListMain({ state }: { state: PublisherListState }) {
  return (
    <gov-container class="publishers-container">
      <br />
      <h1>{state.heading}</h1>
      <p>
        {" "}
        {state.message}{" "}
      </p>
      <gov-grid>
        {state.publishers.map((publisher) => (
          <PublisherCard publisher={publisher} state={state} />
        ))}
      </gov-grid>
    </gov-container>
  );
}

function PublisherCard({
  publisher,
  state,
}: {
  publisher: PublisherListPublisher;
  state: PublisherListState;
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
          <a href={publisher.href}>
            <h3 class="gov-card__title inline">
              {" "}
              {publisher.label}{" "}
            </h3>
            <gov-icon name="box-arrow-up-right"></gov-icon>
          </a>
        </div>
        <div class="gov-card__inner grow">
          <div class="gov-card__main">
            <div class="flex-row x-large gap-4">
              <a
                href={publisher.dashboardMonthly}
                title={state.dashboardMonthlyLabel}
              >
                <gov-icon name="clipboard2-data" type="bootstrap"></gov-icon>
              </a>
              <a
                href={publisher.dashboardDaily}
                title={state.dashboardDailyLabel}
              >
                <gov-icon name="clipboard2-pulse" type="bootstrap"></gov-icon>
              </a>
            </div>
            <div class="flex-row gap-2">
              {publisher.badges.vdf ? (
                <gov-chip variant="primary" type="outlined" size="xs">
                  {" "}
                  VDF{" "}
                </gov-chip>
              ) : null}
              {publisher.badges.vdfOriginator ? (
                <gov-chip variant="primary" type="outlined" size="xs">
                  {" "}
                  {state.vdfOriginatorLabel}{" "}
                </gov-chip>
              ) : null}
              {publisher.badges.vdfPublisher ? (
                <gov-chip variant="primary" type="outlined" size="xs">
                  {" "}
                  {state.vdfPublisherLabel}{" "}
                </gov-chip>
              ) : null}
            </div>
          </div>
          <div class="gov-card__footer">
            {" "}
            {publisher.message}{" "}
          </div>
        </div>
      </gov-card>
    </gov-grid-item>
  );
}
