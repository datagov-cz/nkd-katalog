import { FastifyReply } from "fastify";

import { ROUTE } from "../route-name.mjs";
import * as components from "../../component/index.mjs";
import {headerHtml} from "../../component/header.ts";
import {footerHtml} from "../../component/footer.ts";
import type { Configuration } from "../../configuration.ts";
import type { NavigationEntry } from "../../service/navigation-service.ts";
import type { TranslationService } from "../../service/translation-service.ts";
import type { Language } from "../../localization/index.ts";
import type {
  PublisherListData,
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
  const templateData = prepareTemplateData(
    services.configuration, services.navigation,
    services.translation, languages, query, data);
  const template = services.template.view(ROUTE.PUBLISHER_LIST);
  reply
    .code(200)
    .header("Content-Type", "text/html; charset=utf-8")
    .send(template(templateData));
}

export function prepareTemplateData(
  configuration: Configuration,
  navigation: NavigationEntry,
  translation: TranslationService,
  languages: Language[],
  query: ServerQuery,
  data: PublisherListData,
): PublisherListState {
  preparePublishersInPlace(configuration, navigation, translation, data["publishers"])
  return {
    "head": components.createHeadData(configuration),
    "headerHtml": headerHtml(navigation, languages[0], query),
    "footerHtml": footerHtml(languages[0]),
    "translation": translation.dictionary,
    "message": translation.translate("items-found", data["publishers"].length),
    "publishers": data["publishers"],
  };
}

function preparePublishersInPlace(configuration, navigation, translation, publishers) {
  const datasetListNavigation = navigation.changeView(ROUTE.DATASET_LIST);
  for (const publisher of publishers) {
    publisher["href"] = datasetListNavigation.linkFromServer({
      "publisher": publisher["iri"]
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


