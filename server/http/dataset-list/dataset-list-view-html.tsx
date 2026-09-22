import { FastifyReply } from "fastify";

import { ROUTE } from "../route-name.mjs";
import * as components from "../../component/index.mjs";
import { Head } from "../../component/head.tsx";
import { OpenFacet, DurationFacet } from "../../component/facet.tsx";
import { headerHtml } from "../../component/header.ts";
import { footerHtml } from "../../component/footer.ts";
import { renderToHtml } from "../../html/render-html.ts";
import { breakLines } from "../../html/escape.ts";
import type { Configuration } from "../../configuration.ts";
import type { TranslationService } from "../../service/translation-service.ts";
import type { NavigationEntry } from "../../service/navigation-service.ts";
import type { Language } from "../../localization/index.ts";
import type { QuerySectionState } from "../../component/query-section.tsx";
import type {
  DatasetListData,
  DatasetListDocument,
  DatasetListQuery,
  DatasetListState,
  DatasetListViewServices,
} from "./dataset-list-state.ts";
import { ViewContext } from "../../service/view-context.ts";
import { ListSearchHeader } from "../../component/list-search-header.tsx";
import { ListSearchControls } from "../../component/list-search-controls.tsx";
import { ListOfItems } from "../../component/list-search-items.tsx";
import { DynamicDataChip, HighValueDatasetChip, NonPublicChip, OpenDataChip } from "../../component/legislation-chips.tsx";

const FACET_SERIES = {
  "name": "datasetSeries",
  "tooltip": "datasetSeriesTooltip"
};

// TODO Replace with hard-coded facets in the DatasetListState.
const FACETS = [
  { "name": "publisher", "tooltip": "publisherTooltip" },
  { "name": "datasetType", "tooltip": "datasetTypeTooltip" },
  { "name": "theme", "tooltip": "themeTooltip" },
  { "name": "hvdCategory", "tooltip": "hvdCategoryTooltip" },
  { "name": "dataServiceType", "tooltip": "dataServiceTypeTooltip" },
  { "name": "format", "tooltip": "formatTooltip" },
  { "name": "keyword", "tooltip": "keywordTooltip" },
  { "name": "isvs", "tooltip": "isvsTooltip" }
];

const SORT_OPTIONS = [
  ["title", "asc"],
  ["title", "desc"],
];

export function renderHtml(
  services: DatasetListViewServices,
  languages: Language[],
  query: DatasetListQuery,
  data: DatasetListData,
  reply: FastifyReply,
): void {
  const state = prepareTemplateData(
    services.configuration, services.translation, services.navigation,
    languages, query, data);
  const ctx: ViewContext = {
    t: services.translation.t,
    language: languages[0],
    navigation: services.navigation
  };
  const html = renderDatasetListHtml(state, ctx);
  reply
    .code(200)
    .header("Content-Type", "text/html; charset=utf-8")
    .send(html);
}

export function prepareTemplateData(
  configuration: Configuration,
  translation: TranslationService,
  navigation: NavigationEntry,
  languages: Language[],
  query: DatasetListQuery,
  data: DatasetListData,
): DatasetListState {
  const documents = data["documents"];
  prepareDocumentsInPlace(translation, navigation, documents);
  const count = data["found"]["documents"];
  const facets = prepareFacets(translation, navigation, query, data["facets"], data["found"]);

  const querySection: QuerySectionState = {
    temporalStart: null,
    temporalEnd: null,
    publishers: [],
    dataServiceTypes: [],
    themes: [],
    hvdCategories: [],
    datasetTypes: [],
    formats: [],
    keywords: [],
    isvs: []
  };

  if (query.temporalStart) {
    querySection.temporalStart = {
      label: query.temporalStart,
      href: navigation.linkFromServer({ ...query, temporalStart: undefined }),
    };
  }
  if (query.temporalEnd) {
    querySection.temporalEnd = {
      label: query.temporalEnd,
      href: navigation.linkFromServer({ ...query, temporalEnd: undefined }),
    };
  }

  // We know the facets ordering is the same as in the array.
  const [
    publishers, datasetTypes, themes, hvdCategories, dataServiceTypes,
    formats, keywords, isvs,
  ] = facets;
  const active = (facet) => facet.items
    .filter((item) => item.active)
    .map((item) => ({ label: item.label, href: item.href }));
  querySection.publishers = active(publishers);
  querySection.datasetTypes = active(datasetTypes);
  querySection.themes = active(themes);
  querySection.hvdCategories = active(hvdCategories);
  querySection.dataServiceTypes = active(dataServiceTypes);
  querySection.formats = active(formats);
  querySection.keywords = active(keywords);
  querySection.isvs = active(isvs);

  return {
    "head": components.createHeadData(configuration),
    "clearFilters": navigation.linkFromServer({}),
    "search": { "query": { "searchQuery": query.searchQuery } },
    "navigation": {
      "url": navigation.linkFromServer({ ...query, "page": 0 }),
      "searchName": navigation.queryNameFromServer("query"),
      "temporalStartName": navigation.queryNameFromServer("temporal-start"),
      "temporalEndName": navigation.queryNameFromServer("temporal-end"),
    },
    "querySection": components.createQuerySectionData(querySection, languages[0]),
    "resultBar": components.createResultBarData(translation, navigation, query, SORT_OPTIONS, count),
    "pagination": components.createPaginationData(navigation, query, count),
    "documents": documents,
    "facets": facets,
    "query": query,
  };
}

function prepareDocumentsInPlace(translation, navigation, documents) {
  const detailNavigation = navigation.changeView(ROUTE.DATASET_DETAIL);
  for (const document of documents) {
    document["href"] = detailNavigation.linkFromServer({ "iri": document["iri"] });
    for (const format of document["format"] ?? []) {
      format.tooltip = translation.translate("format-tooltip", format.label);
    }
  }
}

function prepareFacets(translation, navigation, query, facets, counts) {
  const result = [];
  if (query.isPartOf.length > 0) {
    const name = "isPartOf";
    const facetData = facets[name];
    const facetLabel = translation.translate(FACET_SERIES.name);
    const facetTooltip = translation.translate(FACET_SERIES.tooltip);
    result.push(components.createFacetData(
      navigation, query, facetData, name, facetLabel, facetTooltip,
      query.isPartOf.length, translation));
  }
  for (const { name, tooltip } of FACETS) {
    const facetData = facets[name];
    const facetLabel = translation.translate(name);
    const facetTooltip = tooltip === undefined ? undefined :
      translation.translate(tooltip);
    result.push(components.createFacetData(
      navigation, query, facetData, name, facetLabel, facetTooltip,
      counts[name], translation));
  }
  return result;
}

// -- View -----------------------------------------------------------------

export function renderDatasetListHtml(
  state: DatasetListState,
  ctx: ViewContext,
): string {
  return `<!DOCTYPE html>
  <html dir="ltr" lang="${ctx.language}">
  <head>${renderToHtml(<DatasetListHead state={state} ctx={ctx} />)}</head>
  <body>
    <div class="gov-story-theme-scope">
      ${headerHtml(ctx.navigation, ctx.language, state.query)}
      ${renderToHtml(<Main state={state} ctx={ctx} />)}
      ${footerHtml(ctx.language)}
    </div>
  </body>
  </html>`;
}

function DatasetListHead({ state, ctx }: {
  state: DatasetListState,
  ctx: ViewContext,
}) {
  return (
    <>
      <Head state={state.head} />
      <title>{ctx.t("page-title")}</title>
      <meta name="description" content={ctx.t("page-description")} />
      <link rel="canonical" href="/datasets" />
      <link rel="alternate" href="/datové-sady" hreflang="cs" />
      <link rel="alternate" href="/datasets" hreflang="en" />
    </>
  );
}

function Main({ state, ctx }: {
  state: DatasetListState,
  ctx: ViewContext,
}) {
  const filters: { label: string, ariaLabel: string, href: string }[] = [];
  if (state.querySection.temporalStart !== null) {
    filters.push({
      href: state.querySection.temporalStart.href,
      label: state.querySection.temporalStart.label,
      ariaLabel: ctx.t("cancel-filter", state.querySection.temporalStart.label),
    });
  }
  if (state.querySection.temporalEnd !== null) {
    filters.push({
      href: state.querySection.temporalEnd.href,
      label: state.querySection.temporalEnd.label,
      ariaLabel: ctx.t("cancel-filter", state.querySection.temporalEnd.label),
    });
  }
  for (const facet of state.facets) {
    for (const item of facet.items) {
      if (!item.active) {
        continue;
      }
      //
      const label = item.label ?? item.iri;
      filters.push({
        href: item.href,
        label: label,
        ariaLabel: ctx.t("cancel-filter", label),
      });
    }
  }
  //
  const facets = (
    <>
      {state.facets.map(item => <OpenFacet ctx={ctx} state={item} />)}
      <DurationFacet state={{
        from: state.query.temporalStart,
        to: state.query.temporalEnd,
        label: ctx.t("temporal-coverage"),
        labelFrom: ctx.t("temporal-from"),
        labelTo: ctx.t("temporal-to"),
        navigationNameFrom: state.navigation.temporalStartName,
        navigationNameTo: state.navigation.temporalEndName,
      }} />
    </>
  );
  //
  return (
    <gov-container data-navigation-url={state.navigation.url}>
      <gov-layout type="aside" variant="left">
        <gov-layout-column className="gov-desktop-only">
          <aside aria-label={ctx.t("search-result-filters")}>
            <form className="gov-filters">
              <gov-flex direction="column" gap="s">
                {facets}
              </gov-flex>
            </form>
          </aside>
        </gov-layout-column>
        <gov-layout-column>
          <main>
            <ListSearchHeader state={{ value: state.search.query.searchQuery, navigationName: state.navigation.searchName }} ctx={ctx} />
            <gov-flex direction="column" gap="xl">
              <ListSearchControls state={{
                message: state.resultBar.message,
                ordering: {
                  active: state.resultBar.ordering.items.find(item => item.href === state.resultBar.ordering.active)
                    ?? state.resultBar.ordering.items[0],
                  items: state.resultBar.ordering.items,
                },
                filters,
                clearFilters: state.clearFilters,
              }} ctx={ctx} facets={facets}/>
              <ListOfItems state={{
                items: state.documents,
                pagination: state.pagination,
                component: DatasetItem,
              }} ctx={ctx} />
            </gov-flex>
          </main>
        </gov-layout-column>
      </gov-layout>
    </gov-container>
  )
}

function DatasetItem({ value, ctx }: {
  value: DatasetListDocument,
  ctx: ViewContext,
}) {
  const tags = [];

  if (value.isHvd) {
    tags.push((
      <li>
        <HighValueDatasetChip ctx={ctx} />
      </li>
    ));
  }

  if (value.isOpenData) {
    tags.push((
      <li>
        <OpenDataChip ctx={ctx} />
      </li>
    ));
  }

  if (value.isNonPublicData) {
    tags.push((
      <li>
        <NonPublicChip ctx={ctx} />
      </li>
    ));
  }

  if (value.isDynamicData) {
    tags.push((
      <li>
        <DynamicDataChip ctx={ctx} />
      </li>
    ));
  }

  const description = " " + breakLines(value.description) + " ";
  const headlineId = "dataset-" + encodeURIComponent(value.iri);

  return (
    <article>
      <gov-card direction="horizontal" href={value.href} aria-labelledby={headlineId}>
        <gov-flex gap="s" direction="column">
          <header>
            <gov-flex gap="s" direction="column">
              {tags.length === 0 ? null : (
                <ul className="gov-tags gov-list--plain">
                  {tags}
                </ul>
              )}
              <h3 id={headlineId} className="gov-card__headline">
                {value.title}
              </h3>
            </gov-flex>
          </header>
          <p className="line-clamp-3" dangerouslySetInnerHTML={{ __html: description }} />
          <ul className="gov-tags gov-list--plain">
            {value.format.map(item => (
              <li>
                <gov-tag color="neutral" type="subtle" size="xs">
                  {item.label}
                </gov-tag>
              </li>
            ))}
          </ul>
        </gov-flex>
      </gov-card>
    </article>
  )
}
