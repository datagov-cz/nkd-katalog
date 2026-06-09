window.addEventListener("load", () => {
  const localization = window.search.localization;
  const searchElement = document.querySelector("#search");
  const extendedSearchElement = document.querySelector(".extended-search");
  const temporalFromElement = extendedSearchElement.querySelector(
    "gov-form-input[data-type=time-from]",
  );
  const temporalToElement = extendedSearchElement.querySelector(
    "gov-form-input[data-type=time-to]",
  );

  const query = { ...window.search.query };
  const initialQuery = { ...window.search.query };

  // Register events. For general purpose functions we use "data-type"
  // to detect required action.
  searchElement.addEventListener("gov-input", onInput);
  searchElement.addEventListener("gov-keydown", onTextSearchKeyDown);
  searchElement.addEventListener("gov-click", onClick);
  extendedSearchElement.addEventListener("gov-input", onInput);
  extendedSearchElement.addEventListener("gov-change", onChange);
  extendedSearchElement.addEventListener("gov-click", onClick);

  /**
   * Update query based on the change in the user interface.
   */
  function onInput(event) {
    const type = event.target.dataset.type;
    if (type === "query") {
      query.searchQuery = event.target.value;
    } else if (type === "time-from") {
      query.temporalFrom = event.target.value;
    } else if (type === "time-to") {
      query.temporalTo = event.target.value;
    }
  }

  /**
   * Check key down as we need to submit on enter.
   */
  function onTextSearchKeyDown(event) {
    if (event.detail.originalEvent.code === "Enter") {
      submitQuery();
    }
  }

  function submitQuery() {
    if (isQuerySameAsInitial()) {
      return;
    }

    const urlQuery = [];
    addToUrlQueryWhenNotEmpty(
      urlQuery,
      localization.searchQuery,
      query.searchQuery,
    );
    addToUrlQueryWhenNotEmpty(
      urlQuery,
      localization.temporalFrom,
      query.temporalFrom,
    );
    addToUrlQueryWhenNotEmpty(
      urlQuery,
      localization.temporalTo,
      query.temporalTo,
    );
    addToUrlQueryWhenTrue(urlQuery, localization.publicData, query.publicData);
    addToUrlQueryWhenTrue(urlQuery, localization.codelist, query.codelist);
    addToUrlQueryWhenTrue(
      urlQuery,
      localization.dynamicData,
      query.dynamicData,
    );

    let url = searchElement.dataset.baseUrl;
    // Prepare URL for adding query.
    if (url.includes("?")) {
      url += "&";
    } else {
      url += "?";
    }
    url += urlQuery.join("&");
    window.location.href = url;
  }

  function isQuerySameAsInitial() {
    for (const key of Object.keys(query)) {
      if (query[key] !== initialQuery[key]) {
        return false;
      }
    }
    return true;
  }

  function addToUrlQueryWhenNotEmpty(query, name, value) {
    if (value === "" || value === null || value === undefined) {
      return;
    }
    query.push(name + "=" + encodeURIComponent(value));
  }

  function addToUrlQueryWhenTrue(query, name, value) {
    if (value === true) {
      query.push(name + "=1");
    }
  }

  /**
   * Update query based on the change in the user interface.
   */
  function onChange(event) {
    const type = event.target.dataset.type;
    if (type === "time-from") {
      query.temporalFrom = event.target.value;
    } else if (type === "time-to") {
      query.temporalTo = event.target.value;
    } else if (type === "public-data") {
      query.publicData = event.target.checked;
    } else if (type === "codelist") {
      query.codelist = event.target.checked;
    } else if (type === "dynamic-data") {
      query.dynamicData = event.target.checked;
    }
  }

  function onClick(event) {
    const type = event.target.dataset.type;
    if (type === "submit") {
      submitQuery();
    } else if (type === "this-year") {
      const [from, to] = getThisYear();
      temporalFromElement.setValue(from);
      temporalToElement.setValue(to);
      query.temporalFrom = from;
      query.temporalTo = to;
    } else if (type === "last-year") {
      const [from, to] = getLastYear();
      temporalFromElement.setValue(from);
      temporalToElement.setValue(to);
      query.temporalFrom = from;
      query.temporalTo = to;
    }
  }

  const getThisYear = () => {
    const year = new Date().getFullYear();
    return [year + "-01-01", year + "-12-31"];
  };

  const getLastYear = () => {
    const year = new Date().getFullYear() - 1;
    return [year + "-01-01", year + "-12-31"];
  };

  registerPageSizeHandler();
});

function registerPageSizeHandler() {
  const paginatorElement = document.querySelector("#page-size");
  paginatorElement.addEventListener("gov-change", (event) => {
    const pageSize = event.target.value;
    const url = event.target.dataset.href.replace("_PAGE_SIZE_", pageSize);
    window.location.href = url;
  });
}
