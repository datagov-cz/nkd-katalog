import { FastifyReply } from "fastify";

import { ROUTE } from "../route-name.mjs";
import * as components from "../../component/index.mjs";
import {headerHtml} from "../../component/header.ts";
import {footerHtml} from "../../component/footer.ts";
import type { NavigationEntry } from "../../service/navigation-service.ts";
import type { Language } from "../../localization/index.ts";
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
  const templateData = prepareTemplateData(services, languages, query, data);
  const template = services.template.view(ROUTE.SUGGESTION_DETAIL);
  reply
    .code(200)
    .header("Content-Type", "text/html; charset=utf-8")
    .send(template(templateData));
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
    "headerHtml": headerHtml(services.navigation, language, query),
    "footerHtml": footerHtml(language),
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
