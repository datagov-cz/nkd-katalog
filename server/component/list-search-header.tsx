import { ViewContext } from "../service/view-context.ts";

/**
 * Header for a list of search results search.
 */
export function ListSearchHeader({ state, ctx }: {
  state: {
    value: string | null,
    /**
     * Name of the URL query parameter with the search text.
     * The client navigates to the list page with this parameter changed,
     * see `data-navigation-url` in `ListSearchPage`.
     */
    navigationName: string,
  },
  ctx: ViewContext,
}) {
  return (
    <header class="gov-page-heading">
      <gov-flex direction="column" gap="l">
        <h1>{ctx.t("search")}{state.value ? ` "${state.value}"` : ""}</h1>
        <gov-form-control>
          <gov-form-group>
            <gov-form-search color="neutral" size="m">
              <gov-form-input
                slot="input"
                placeholder={ctx.t("search-placeholder")}
                size="m"
                value={state.value}
                data-navigation={state.navigationName}
              />
              <gov-button color="primary" size="m" type="solid" slot="button">
                <gov-icon type="components" name="search" slot="icon-start" />
              </gov-button>
            </gov-form-search>
          </gov-form-group>
        </gov-form-control>
      </gov-flex>
      <br />
    </header>
  )
}
