import type { FunctionComponent } from "preact";

import type { ViewContext } from "../service/view-context.ts";

/**
 * Main section of a list page with no search and no filters:
 * a heading with the number of items followed by a grid of cards.
 */
export function SimpleListPage<ItemType>({ state, ctx }: {
  state: {
    heading: string,
    /** Translated message with number of items found. */
    message: string,
    items: ItemType[],
    /** Component to render a single item, usually a `gov-card`. */
    component: FunctionComponent<{ value: ItemType, ctx: ViewContext }>,
    /**
     * `cards` puts several items next to each other,
     * `list` puts one item per row, as the search result lists do.
     */
    layout?: "cards" | "list",
  },
  ctx: ViewContext,
}) {
  const ItemComponent = state.component;
  const itemProps = state.layout === "list"
    ? { "col-span": "12" }
    : { "col-span": "12", "col-span-md": "6", "col-span-lg": "4" };
  return (
    <gov-container>
      <main>
        <header class="gov-page-heading">
          <gov-flex direction="column" gap="s">
            <h1>{state.heading}</h1>
            <p>{state.message}</p>
          </gov-flex>
          <br />
        </header>
        <section aria-label={state.heading}>
          <gov-grid gap="l" class="gov-card-grid">
            {state.items.map(item => (
              <gov-grid-item {...itemProps}>
                <ItemComponent value={item} ctx={ctx} />
              </gov-grid-item>
            ))}
          </gov-grid>
        </section>
      </main>
    </gov-container>
  );
}
