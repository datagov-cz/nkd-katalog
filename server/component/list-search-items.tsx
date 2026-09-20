import { FunctionComponent } from "preact";

import { Pagination, PaginationState } from "./pagination.tsx";
import { ViewContext } from "../service/view-context.ts";

/**
 * Render paginated list of items.
 */
export function ListOfItems<ItemType>({ state, ctx }: {
  state: {
    /**
     * List of items to render.
     */
    items: ItemType[],
    /**
     * Information about pagination.
     */
    pagination: PaginationState,
    /**
     * Component to render given items.
     */
    component: FunctionComponent<{
      value: ItemType,
      ctx: ViewContext,
    }>,
  },
  ctx: ViewContext,
}) {
  const ItemComponent = state.component;
  return (
    <section aria-label={ctx.t("search-result-list")}>
      <gov-grid gap="l" class="gov-card-grid">
        {state.items.map(item => (
          <gov-grid-item col-span="12">
            <ItemComponent value={item} ctx={ctx} />
          </gov-grid-item>
        ))}
      </gov-grid>
      <Pagination state={state.pagination} ctx={ctx} />
    </section>
  )
}
