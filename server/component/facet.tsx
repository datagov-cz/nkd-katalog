import { DEFAULT_FACET_SIZE } from "../constants.ts";
import type { NavigationEntry } from "../service/navigation-service.ts";
import type { TranslationService } from "../service/translation-service.ts";
import { ViewContext } from "../service/view-context.ts";

export interface FacetItemData {
  iri: string;
  count: number;
  href: string;
  label?: string;
  active?: boolean;
}

export interface FacetData {
  label: string;
  count: number;
  items: FacetItemData[];
  tooltipMessage: string | undefined;
  showMoreHref?: string;
  showInitialHref?: string;
  /** Localized, resolved by {@link createFacetData}. */
  showMoreLabel: string;
  showPopularLabel: string;
}

type Query = Record<
  string,
  string | number | boolean | string[] | null | undefined
>;

export function createFacetData(
  navigation: NavigationEntry,
  query: Query,
  facetData: FacetItemData[],
  facetName: string,
  facetLabel: string,
  tooltipMessage: string | undefined,
  count: number,
  translation: TranslationService,
): FacetData {
  facetData.forEach((item) =>
    prepareFacetItemInPlace(navigation, facetName, query, item),
  );
  const result: FacetData = {
    label: facetLabel,
    count,
    items: facetData,
    tooltipMessage,
    showMoreLabel: translation.dictionary["facet-show-more"],
    showPopularLabel: translation.dictionary["facet-show-popular"],
  };
  if (count > facetData.length) {
    result.showMoreHref = navigation.linkFromServer({
      ...query,
      [facetName + "Limit"]:
        (query[facetName + "Limit"] as number) + DEFAULT_FACET_SIZE,
    });
  }
  if (DEFAULT_FACET_SIZE < facetData.length) {
    result.showInitialHref = navigation.linkFromServer({
      ...query,
      [facetName + "Limit"]: DEFAULT_FACET_SIZE,
    });
  }
  return result;
}

function prepareFacetItemInPlace(
  navigation: NavigationEntry,
  facetName: string,
  query: Query,
  item: FacetItemData,
): void {
  const facetHref = [...((query[facetName] as string[]) ?? [])];
  const index = facetHref.indexOf(item.iri);
  if (index === -1) {
    facetHref.push(item.iri);
  } else {
    facetHref.splice(index, 1);
  }
  item.href = navigation.linkFromServer({
    ...query,
    page: 0,
    [facetName]: facetHref,
  });
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - //

export function OpenFacet({ ctx, state }: {
  ctx: ViewContext, state: FacetData,
}) {
  const value: FacetState = {
    label: state.label,
    tooltip: state.tooltipMessage,
    count: state.count,
    showLessUrl: state.showInitialHref ?? null,
    showMoreUrl: state.showMoreHref ?? null,
    items: state.items.map(item => ({
      label: item.label,
      count: item.count,
      status: item.active ? "active" : "default",
      toggleUrl: item.href,
    } satisfies FacetItemState)),
  };
  return (
    <fieldset>
      {/* TODO aria-label={t("facet-aria-label", state.label)} */}
      <legend class="gov-filters__heading" >
        {state.label} ({state.count})
        {state.tooltipMessage ? (
          <gov-tooltip color="primary" message={state.tooltipMessage}>
            <gov-icon name="question-circle" type="bootstrap"/>
          </gov-tooltip>
        ) : null}
      </legend>
      {renderFacetItems(ctx, value)}
    </fieldset>
  )
}

interface FacetState {

  /**
   * Label (translated).
   */
  label: string;

  /**
   * Tooltip (translated).
   */
  tooltip: string;

  /**
   * Total number of items in the facet.
   */
  count: number;

  showLessUrl: string | null;

  showMoreUrl: string | null;

  /**
   * Items in the facet.
   */
  items: FacetItemState[];

}

interface FacetItemState {

  /**
   * Label (translated).
   */
  label: string;

  /**
   * Number of items with this value.
   */
  count: number;

  /**
   * URL to toggle status.
   */
  toggleUrl: string;

  status: "active" | "default";

}

function renderFacetItems(ctx: ViewContext, state: FacetState) {
  return (
    <ul class="gov-list--plain">
      {state.items.map(item => (
        <li>
          <gov-form-checkbox
            size="m"
            value={item.label}
            checked={item.status === "active"}
            data-href={item.toggleUrl}
          >
            <gov-form-label size="m" slot="label">
              {item.label} ({item.count})
            </gov-form-label>
          </gov-form-checkbox>
        </li>
      ))}
      {state.showLessUrl === null ? null : (
        <li>
          {/* TODO accessible-label */}
          <gov-button color="neutral" type="base" size="s" href={state.showLessUrl}>
            {ctx.t("facet-show-popular")}
            <gov-icon slot="icon-end" type="components" name="chevron-up" size="m" />
          </gov-button>
        </li>
      )}
      {state.showMoreUrl === null ? null : (
        <li>
          {/* TODO accessible-label */}
          <gov-button color="neutral" type="base" size="s" href={state.showMoreUrl}>
            {ctx.t("facet-show-more")}
            <gov-icon slot="icon-end" type="components" name="chevron-down" size="m" />
          </gov-button>
        </li>
      )}
    </ul>
  )
}

/** Collapsed facet is not supported as of now. */
function CollapsedFacet({ ctx, state }: {
  ctx: ViewContext, state: FacetData,
}) {
  const value: FacetState = {
    label: state.label,
    tooltip: state.tooltipMessage,
    count: state.count,
    showLessUrl: state.showInitialHref ?? null,
    showMoreUrl: state.showMoreHref ?? null,
    items: state.items.map(item => ({
      label: item.label,
      count: item.count,
      status: item.active ? "active" : "default",
      toggleUrl: item.href,
    } satisfies FacetItemState)),
  };
  return (
    <gov-accordion-item>
      <span slot="label">{ctx.t(state.label)}</span>
      {renderFacetItems(ctx, value)}
    </gov-accordion-item>
  )
}

/** TODO Source facet translations from here. */
const translations = {
  cs: {
    "search-result-filters": "Filtr výsledků vyhledávání",
    "additional-search-result-filters": "Další filtry výsledků vyhledávání",
    "facet-show-more": "",
    "facet-show-popular": "",
  },
  en: {
    "search-result-filters": "Search results filter",
  }
}

export function DurationFacet({ state }: {
  state: {
    label: string,
    labelFrom: string,
    labelTo: string,
    /**
     * Names of the query parameters with the start and the end of the period.
     * The client navigates to the list page with the parameter changed.
     */
    navigationNameFrom: string,
    navigationNameTo: string,
    // TODO Migrate to Date
    from: string | null,
    to: string | null,
  },
}) {
  return (
    <fieldset>
      {/* TODO aria-label={t("facet-aria-label", state.label)} */}
      <legend class="gov-filters__heading" >
        {state.label}
        {/* <gov-tooltip color="primary" message={state.tooltip}>?</gov-tooltip> */}
      </legend>
      <gov-form-control>
        <gov-form-label slot="top" size="s">{state.labelFrom}</gov-form-label>
        <gov-form-group>
          <gov-form-input
            input-type="date"
            size="s"
            value={state.from ?? ""}
            data-navigation={state.navigationNameFrom}
          />
        </gov-form-group>
      </gov-form-control>
      <gov-form-control>
        <gov-form-label slot="top" size="s">{state.labelTo}</gov-form-label>
        <gov-form-group>
          <gov-form-input
            input-type="date"
            size="s"
            value={state.to ?? ""}
            data-navigation={state.navigationNameTo}
          />
        </gov-form-group>
      </gov-form-control>
    </fieldset>
  )
}

/**
 * TODO:
 * Container search text input on top "Filtrujte obor". *
 * https://designsystem.gov.cz/_media/showcase/templates/kariera/vychozi.webp
 */
function FilterableFacet() {

}

/**
 * TODO
 * Just a search text input.
 * https://designsystem.gov.cz/_media/showcase/templates/kariera/vychozi.webp
 */
function LocationFacet() {

}
