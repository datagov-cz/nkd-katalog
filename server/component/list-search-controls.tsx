import { VNode } from "preact";
import { ViewContext } from "../service/view-context.ts"

/**
 * Section with controls for a list of search results search.
 */
export function ListSearchControls(props: {
  state: {
    /**
     * Translated message with number of items found.
     */
    message: string,
    /**
     * Information about item ordering.
     */
    ordering: {
      /**
       * Active ordering.
       */
      active: {
        /**
         * Translated ordering item label.
         */
        label: string,
      },
      /**
       * Alternative ordering.
       */
      items: {
        /**
         * Translated ordering item label.
         */
        label: string,
        /**
         * Link to a website with given ordering.
         */
        href: string,
      }[],
    },
    /**
     * Active filters.
     */
    filters: ActiveFilter[],
    /**
     * Link to a website with all filters disabled.
     */
    clearFilters: string,
  },
  ctx: ViewContext,
  /**
   * Facets to render on mobile device.
   */
  facets: VNode,
}) {
  const {state, ctx, facets} = props;
  return (
    <>
      <section aria-label={ctx.t("results-count-and-ordering")}>
        <gov-flex gap="m" justify-content="space-between" align-items="center">
          <span>{state.message}</span>
          <gov-button color="primary" size="m" type="solid" class="gov-mobile-only gov-button-text-left" expanded="" data-toggle="dialog" data-target="mobile-filter-dialog">
            <gov-icon type="components" name="list" slot="icon-start" />
            {ctx.t("filter-results")}
          </gov-button>
          <gov-dialog id="mobile-filter-dialog" accessible-close-label={ctx.t("close-filter-dialog")}>
            <h3 slot="title">{ctx.t("filter-dialog-title")}</h3>
            <form class="gov-filters">
              {facets}
            </form>
            <gov-button color="error" size="m" type="base" expanded="" slot="footer" href={state.clearFilters}>
              {ctx.t("clear-filters")}
            </gov-button>
            {/* For now we apply by direct action on the facet element.
            <gov-button color="primary" size="m" type="solid" expanded="" slot="footer">
              {ctx.t("apply-filter-dialog")}
            </gov-button>
             */}
          </gov-dialog>
          {/*  */}
          <gov-dropdown class="gov-mobile-only" aria-label={ctx.t("results-ordering")}>
            <gov-button color="primary" size="m" type="outlined" class="gov-button-text-left" expanded="">
              <gov-icon type="components" name="chevron-down" slot="icon-start" />
              <span class="gov-text-weight--normal">{ctx.t("ordering")}</span>
              {state.ordering.active.label}
            </gov-button>
            <ul slot="list" role="menu">
              {state.ordering.items.map(item => (
                <li role="presentation">
                  <gov-button color="neutral" size="m" type="base" expanded="" role="menuitem" href={item.href}>
                    {item.label}
                  </gov-button>
                </li>
              ))}
            </ul>
          </gov-dropdown>
          <gov-dropdown position="right" class="gov-desktop-only" aria-label={ctx.t("results-ordering")}>
            <gov-button color="primary" size="m" type="base">
              <span class="gov-text-weight--normal">{ctx.t("ordering")}</span>
              {state.ordering.active.label}
              <gov-icon type="components" name="chevron-down" slot="icon-end" />
            </gov-button>
            <ul slot="list" role="menu">
              {state.ordering.items.map(item => (
                <li role="presentation">
                  <gov-button color="neutral" size="m" type="base" expanded="" role="menuitem" href={item.href}>
                    {item.label}
                  </gov-button>
                </li>
              ))}
            </ul>
          </gov-dropdown>
        </gov-flex>
      </section>
      <section aria-label={ctx.t("active-filters")}>
        <gov-flex justify-content="space-between" align-items="center" responsive="false" class="gov-mobile-only gov-mb--s">
          <span>{ctx.t("active-filters")}</span>
        </gov-flex>
        <gov-flex justify-content="space-between" align-items="center" responsive="false">
          <gov-flex gap="s" align-items="center" wrap="wrap" responsive="false">
            <span class="gov-desktop-only"></span>
            {state.filters.map(item => (
              <div class="gov-filter-tag">
                {item.label}
                <gov-button color="primary" size="s" type="base" aria-label={item.ariaLabel} href={item.href}>
                  <gov-icon slot="icon-start" type="components" name="x-lg" />
                </gov-button>
              </div>
            ))}
          </gov-flex>
          <gov-button color="primary" size="s" type="base" aria-label={ctx.t("clear-filters-aria")} href={state.clearFilters}>
            {ctx.t("clear-filters")}
          </gov-button>
        </gov-flex>
      </section>
    </>
  )
}

interface ActiveFilter {
  /**
   * Label after translation.
   */
  label: string,
  /**
   * ARIA label.
   */
  ariaLabel: string,
  /**
   * Link to a website with disabled filter.
   */
  href: string,
}
