import type { NavigationEntry } from "../service/navigation-service.ts";
import type { TranslationService } from "../service/translation-service.ts";

export interface ResultBarState {
  message: string;
  /** Localized, resolved by {@link createResultBarData}. */
  wcagSortLabel: string;
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
  query: Query,
  sortOptions: string[][],
  itemsCount: number,
): ResultBarState {
  return {
    message: translation.translate("items-found", itemsCount),
    wcagSortLabel: translation.dictionary["result-bar-sort-label"],
    ordering: createOrdering(translation, navigation, query, sortOptions),
  };
}

function createOrdering(
  translation: TranslationService,
  navigation: NavigationEntry,
  query: Query,
  sortOptions: string[][],
): ResultBarState["ordering"] {
  const activeSort = query["sort"];
  const activeDirection = query["sortDirection"];
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

const ORDER_BY_SCRIPT = `
    document.getElementById("order-by").addEventListener("gov-change", (event) => {
      window.location= event.target.value;
    });
  `;

export function ResultBar({ state }: { state: ResultBarState }) {
  return (
    <gov-grid class="p-2">
      <gov-grid-item size-sm="12/12" size-md="8/12">
        {" "}
        {state.message}{" "}
      </gov-grid-item>
      <gov-grid-item size-sm="12/12" size-md="4/12">
        <gov-form-select
          wcag-label={state.wcagSortLabel}
          id="order-by"
          value={state.ordering.active}
        >
          {state.ordering.items.map((item) => (
            <option value={item.href}>{item.label}</option>
          ))}
        </gov-form-select>
      </gov-grid-item>
      <script dangerouslySetInnerHTML={{ __html: ORDER_BY_SCRIPT }}></script>
    </gov-grid>
  );
}
