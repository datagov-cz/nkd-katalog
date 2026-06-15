/**
 * @typedef {{
 *   updateFacetInPlace: (
 *     languages: string[],
 *     items: Array<{ iri: string, count: number }>,
 *     active: string[],
 *     limit: number,
 *     labelCallback?: Function | null
 *   ) => Promise<void>
 * }} FacetService
 */

/**
 * @param {import('./label-service.ts').LabelService} labelService
 * @returns {FacetService}
 */
export function createFacetService(labelService) {
  return {
    /**
     * Make sure active are part of result, add labels, and sort.
     * @param {String[]} languages Language preferences.
     * @param {Object[]} items Items.
     * @param {String[]} active IRIs of active facets.
     * @param {Number} limit Number of facets to prepare.
     * @param {*} labelCallback
     * @returns
     */
    "updateFacetInPlace": (languages, items, active, limit, labelCallback = null) =>
      updateFacetInPlace(labelService, languages, items, active, limit, labelCallback),
  }
}

async function updateFacetInPlace(
  labelService, languages, items, active, limit, labelCallback
) {
  addActivityAndActive(items, active);
  // We should not load labels for all facets as that can be a lot of requests.
  // To tackle this issue we first sort by activity and count.
  partialSortByActivityAndCount(items);
  softSizeLengthByCount(items, limit);
  // Fetch labels.
  if (labelCallback == null) {
    await labelService.addLabelToResources(languages, items);
  } else {
    items.forEach(labelCallback);
  }
  // Apply final sort of remove items after limit.
  items.sort(createCompareFacetItems(languages[0]));
  if (limit !== -1 && limit < items.length) {
    items.length = limit;
  }
}

function addActivityAndActive(items, active) {
  const missingActive = new Set(active);
  for (const item of items) {
    const iri = item["iri"];
    // Return true, when removed, i.e. active.
    item["active"] = missingActive.delete(iri);
  }
  for (const iri of missingActive) {
    items.push({
      "iri": iri,
      "count": 0,
      "active": true,
    })
  }
}

function partialSortByActivityAndCount(items) {
  items.sort((left, right) => {
    if (left.active && !right.active) {
      return -1;
    }
    if (!left.active && right.active) {
      return 1;
    }
    return right.count - left.count;
  });
}

function softSizeLengthByCount(items, softLimit)  {
  if (softLimit === -1 || softLimit >= items.length) {
    return;
  }
  // Start at soft limit
  let nextLength = softLimit;
  const countLimit = items[softLimit].count;
  for (let index = softLimit; index < items.length; ++index) {
    if (items[index].count < countLimit) {
      nextLength = index;
      break;
    }
  }
  items.length = nextLength;
}

function createCompareFacetItems(language) {
  return (left, right) => {
    if (left.active && !right.active) {
      return -1;
    }
    if (!left.active && right.active) {
      return 1;
    }
    const count = right.count - left.count;
    if (count === 0) {
      return left.label.localeCompare(right.label, language);
    }
    return count;
  };
}
