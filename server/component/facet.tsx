import { DEFAULT_FACET_SIZE } from "../constants.ts";
import type { NavigationEntry } from "../service/navigation-service.ts";
import type { TranslationService } from "../service/translation-service.ts";

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

export function Facet({ state }: { state: FacetData }) {
  return (
    <div class="facet">
      <div class="flex-space-between align-items-center">
        <h3 class="facet-title inline">
          {" "}
          {state.label} ({state.count}){" "}
        </h3>
        {state.tooltipMessage ? (
          <gov-tooltip>
            <gov-icon
              name="question-circle"
              type="bootstrap"
              class="larger"
            ></gov-icon>
            <gov-tooltip-content>
              {" "}
              {state.tooltipMessage}{" "}
            </gov-tooltip-content>
          </gov-tooltip>
        ) : null}
      </div>
      <ul class="facet-list">
        {state.items.map((item) => (
          <li class={"facet-item " + (item.active ? "active" : "")}>
            <a href={item.href}>
              {" "}
              {item.label} ({item.count}){" "}
            </a>
          </li>
        ))}
        {state.showMoreHref ? (
          <li class="facet-item italic">
            <a href={state.showMoreHref}>{state.showMoreLabel}</a>
          </li>
        ) : null}
        {state.showInitialHref ? (
          <li class="facet-item italic">
            <a href={state.showInitialHref}>{state.showPopularLabel}</a>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
