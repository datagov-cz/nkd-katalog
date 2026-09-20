import type { NavigationEntry } from "../service/navigation-service.ts";
import type { TranslationService } from "../service/translation-service.ts";

export interface ResultBarState {
  message: string;
  ordering: {
    active: string;
    items: { label: string; href: string }[];
  };
}

type Query = Record<
  string,
  string | number | boolean | string[] | null | undefined
>;

export function createResultBarData(
  translation: TranslationService,
  navigation: NavigationEntry,
  query: object,
  sortOptions: string[][],
  itemsCount: number,
): ResultBarState {
  return {
    message: translation.translate("items-found", itemsCount),
    ordering: createOrdering(translation, navigation, query, sortOptions),
  };
}

function createOrdering(
  translation: TranslationService,
  navigation: NavigationEntry,
  query: object,
  sortOptions: string[][],
): ResultBarState["ordering"] {
  const { sort: activeSort, sortDirection: activeDirection } = query as Query;
  const items = sortOptions.map(([sort, direction]) => ({
    label:
      translation.translate(sort) + " " + translation.translate(direction),
    href: navigation.linkFromServer({
      ...query,
      page: 0,
      sort,
      sortDirection: direction,
    }),
  }));
  return {
    active: navigation.linkFromServer({
      ...query,
      sort: activeSort,
      sortDirection: activeDirection,
    }),
    items,
  };
}
