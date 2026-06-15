# Type Migration Backlog

Items noted during JSDoc annotation work that deserve follow-up but were left as `any` or approximate types to avoid breaking changes.

---

## Component: `navigation.mjs`

### Dynamic language keys in `NavigationData`
`createNavigationData` builds `{ ...options, ...result }` where `result` is `{ [language]: url }` for each language in `languages[]`. The typedef uses an index signature `[key: string]: string | boolean` to accommodate these, but this means TS cannot check which language keys are actually present at runtime.

**Possible improvement**: If the set of languages is always `["cs", "en"]`, the typedef could be:
```ts
{ datasetsActive: boolean, ..., cs: string, en: string }
```

### `options` parameter accepts non-object values
In `suggestion-detail-view-html.mjs`, `createNavigationData` is called with `options = true` (a primitive). JavaScript silently ignores `...true`, so at runtime it's a no-op. The `options` param is typed `Record<string, boolean> | any` to allow this. The call site should probably pass `undefined` or `{}` instead.

---

## Component: `facet.mjs`

### `FacetItemData` items are mutated in-place
`createFacetData` receives `FacetItem[]` from Solr (shape: `{ iri, count }`) and calls `prepareFacetItemInPlace` which adds `href` to each item. The function signature uses `any[]` for `facetData` to avoid a TS error because `FacetItem` from `solr-response.ts` does not have `href`. After enrichment by `facet-service.mjs`'s `updateFacetInPlace`, items also gain `label` and `active`.

**Possible improvement**: Extend `FacetItem` in `solr-response.ts` or create a mutable variant that includes the enriched fields.

### `FacetItemData.label` and `active` are optional
The `label` and `active` fields are added by `facet-service.mjs → updateFacetInPlace`, not by `createFacetData` itself. Templates that render facets always assume `label` and `active` are present.

---

## Component: `result-bar.mjs`

### `sortOptions` typed as `string[][]` instead of `[string, string][]`
The sort options arrays like `["title", "asc"]` are inferred as `string[]` (not tuple `[string, string]`) by TypeScript because they are `const` array literals without `as const`. The param type uses `string[][]` to accommodate this.

**Possible improvement**: Add `as const` to all `SORT_OPTIONS` arrays in view-html files, then tighten the param type back to `[string, string][]`.

---

## View: `dataset-detail-view-html.mjs`

### Distributions `items` typed as `any[]`
Each distribution item is assembled via three spread operations (`prepareLegal`, `prepareDistribution`, `prepareDataService`) that produce mutually exclusive shapes (DCAT-AP legal, DCAT-AP-CZ legal, missing legal). The resulting union type is complex and context-dependent. Left as `any[]`.

### `distributions.pagination` is optional
`prepareDistributions` returns `{ visible: false }` with no other fields when there are no items. The typedef uses `pagination?` and `items?` to reflect this, but callers in templates should guard on `visible` before accessing these.

---

## View: `suggestion-detail-view-html.mjs`

### `suggestion.state` typed as `any`
The `state` field starts as `string` (IRI) in `SolrSuggestion`, but `suggestion-detail-model.mjs` replaces it with `{ iri, label }` via `iriToResource`. The view then passes it as-is to the template. Typed as `any` to avoid mismatch.

---

## General: model layer mutates data-source types in place

Several model files (`application-detail-model`, `dataset-detail-model`, `suggestion-detail-model`) receive typed data-source objects and mutate their fields (e.g., replace `string[]` with `{iri, label}[]`). The affected data-source typedefs were widened to `any` or `any[]` to accommodate this pattern:
- `CouchDbDataset.themes`, `euroVocThemes`, `semanticThemes`, `hvdCategory`, `accessRights`, `conformsTo`, `spatial`, `frequency`, `publisher`, `parentDataset`
- `SolrApplication.states`, `platforms`, `themes`, `types`, `datasets`
- `SolrSuggestion.themes`, `state`, `datasets`
- `SolrApplicationsResponse.found`, `SolrSuggestionsResponse.found`, `DatasetsResponse.found`

**Possible improvement**: Introduce separate "view model" types (e.g., `EnrichedCouchDbDataset`) that reflect the enriched shape, and type the model functions to return those instead of mutating the data-source types.
