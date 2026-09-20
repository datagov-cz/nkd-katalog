//
// The client side java script.
//

(() => {
  window.addEventListener("load", () => {
    initializeFacetFilters();
    initializeSearch();
    initializeDateInputs();
    initializeDialogs();
    processQuality();
    processDataLabel();
  });

  /**
   * Redirect user after clicking on a checkbox to data-href.
   *
   * The listener is on the form, as gov-change is emitted by the host element
   * of the checkbox, which has the data-href, and bubbles up to the form.
   */
  function initializeFacetFilters() {
    document.querySelectorAll("form.gov-filters").forEach(form =>
      form.addEventListener("gov-change", (event) => {
        const url = event.target.dataset?.href;
        if (url) {
          window.location.href = url;
        }
      })
    );
  }

  /**
   * Navigate on user input in the search box.
   *
   * The server marks the input with data-navigation, the name of the URL
   * query parameter with the input value. The URL of the first page of the
   * current results is in data-navigation-url of an ancestor.
   * See navigateWith.
   */
  function initializeSearch() {
    document.querySelectorAll("gov-form-search").forEach(search => {
      const input = search.querySelector("gov-form-input[data-navigation]");
      if (input === null) {
        return;
      }
      const initial = (input.getAttribute("value") ?? "").trim();
      const submit = (value) => {
        const trimmed = (value ?? "").trim();
        if (trimmed !== initial) {
          navigateWith(input, trimmed);
        }
      };
      search.addEventListener("gov-keydown", (event) => {
        if (event.detail.originalEvent.code === "Enter") {
          // The value from the event is current even after a paste.
          submit(event.detail.value);
        }
      });
      search.addEventListener("gov-click", () => submit(input.value));
    });
  }

  /**
   * Navigate on user input in date inputs.
   *
   * A complete date navigates after a short pause, so the user can finish
   * typing the year. Leaving the input or pressing enter navigates at once,
   * this is also the only way to navigate with a cleared input, so removing
   * a single segment of the date does not reload the page.
   */
  function initializeDateInputs() {
    const PAUSE_MS = 500;
    document.querySelectorAll('gov-form-input[input-type="date"][data-navigation]').forEach(input => {
      const initial = input.getAttribute("value") ?? "";
      let timer = null;
      const navigate = (value) => {
        clearTimeout(timer);
        if ((value ?? "") !== initial) {
          navigateWith(input, value ?? "");
        }
      };
      input.addEventListener("gov-input", (event) => {
        clearTimeout(timer);
        if (isCompleteDate(event.detail.value)) {
          timer = setTimeout(() => navigate(event.detail.value), PAUSE_MS);
        }
      });
      input.addEventListener("gov-blur", (event) => navigate(event.detail.value));
      input.addEventListener("gov-keydown", (event) => {
        if (event.detail.originalEvent.code === "Enter") {
          navigate(event.detail.value);
        }
      });
    });
  }

  /**
   * @param {string} value
   * @returns {boolean} True for YYYY-MM-DD with a year that has four digits.
   */
  function isCompleteDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
    return match !== null && Number(match[1]) >= 1000
      && !Number.isNaN(Date.parse(value));
  }

  /**
   * Navigate to the first page of the current results, with the query
   * parameter of the input set to the given value.
   */
  function navigateWith(input, value) {
    const root = input.closest("[data-navigation-url]");
    if (root === null) {
      return;
    }
    window.location.href = createNavigationUrl(
      root.dataset.navigationUrl, input.dataset.navigation, value);
  }

  /**
   * @param {string} firstPageUrl URL of the first page of the current results.
   * @param {string} name Name of the query parameter to change.
   * @param {string} value New value, the parameter is removed when empty.
   * @param {string} baseUrl URL to resolve the relative first page URL against.
   * @returns {string} The URL to navigate to.
   */
  function createNavigationUrl(firstPageUrl, name, value, baseUrl = window.location.href) {
    // Links from the server are relative to the current page, as all the others.
    const url = new URL(firstPageUrl, baseUrl);
    if (value === "") {
      url.searchParams.delete(name);
    } else {
      url.searchParams.set(name, value);
    }
    return url.href;
  }

  /**
   * Bootstrap inspired dialog functionality.
   * The activator need to have data-toggle="dialog" and data-target attributes
   * The data-target's value must be id of the target dialog.
   * The dialog is open by adding open=true attribute.
   */
  function initializeDialogs() {
    document.querySelectorAll('[data-toggle="dialog"][data-target]').forEach(element => {
      element.addEventListener("gov-click", () => {
        const dialog = document.getElementById(element.dataset.target);
        dialog?.setAttribute("open", true);
      });
    });
  }

  /**
   * Fetch and display quality indicators.
   */
  function processQuality() {
    const language = document.documentElement.lang;
    const datasetElement = document.querySelector(".dataset-container[data-iri]");
    if (!datasetElement) {
      return;
    }
    fetchAndRenderDatasetQuality(language, datasetElement, datasetElement.dataset.iri);
    const distributionElements = document.querySelectorAll(".distribution-item-wrap[data-iri]");
    distributionElements.forEach((element) =>
      fetchAndRenderDistributionQuality(language, element, element.dataset.iri),
    );
  }

  async function fetchAndRenderDatasetQuality(language, element, iri) {
    const response = await fetchQuality(language, iri);

    const documentationElement = element.querySelector(".documentation .quality");
    const documentation = response.documentation;
    renderQualityMeasure(documentationElement, documentation, "link", "link-45deg");

    const specificationElement = element.querySelector(".specification .quality");
    const specification = response.specification;
    renderQualityMeasure(specificationElement, specification, "link", "link-45deg");
  }

  function fetchQuality(language, iri) {
    const url =
      "/api/v2/catalog/v1/quality?iri=" + encodeURIComponent(iri) +
      "&language=" + encodeURIComponent(language);
    return fetch(url).then((response) => response.json());
  }

  function renderQualityMeasure(element, measure, successIconName, failedIconName) {
    if (element === null || measure === undefined || measure === null) {
      return;
    }
    let icon;
    if (measure.value) {
      icon = createAlrightQualityIcon(successIconName, measure.message);
    } else {
      icon = createFailedQualityIcon(failedIconName, measure.message);
    }
    // As the icon may change size to fit the content we force
    // it to have a fixed size.
    icon.style.width = "1.25rem";
    element.appendChild(icon);
  }

  function createAlrightQualityIcon(name, message) {
    return createQualityIcon(name, "success", message);
  }

  function createQualityIcon(iconName, color, message) {
    const iconElement = document.createElement("gov-icon");
    iconElement.setAttribute("name", iconName);
    iconElement.setAttribute("type", "bootstrap");
    iconElement.setAttribute("color", color);

    const contentElement = document.createElement("gov-tooltip-content");
    contentElement.textContent = message;

    const tooltipElement = document.createElement("gov-tooltip");
    tooltipElement.appendChild(iconElement);
    tooltipElement.appendChild(contentElement);
    return tooltipElement;
  }

  function createFailedQualityIcon(name, message) {
    return createQualityIcon(name, "error", message);
  }

  async function fetchAndRenderDistributionQuality(language, element, iri) {
    const response = await fetchQuality(language, iri);
    renderLegalQuality(element, response);
    renderShared(element, response);
    renderDistributionQuality(element, response);

    // Data service has custom quality measure entity.
    const dataServiceElement = element.querySelector(".data-service[data-iri]");
    if (dataServiceElement !== null) {
      const dataServiceIri = dataServiceElement.dataset.iri;
      const dataServiceResponse = await fetchQuality(language, dataServiceIri);
      renderDataServiceQuality(dataServiceElement, dataServiceResponse);
    }
  }

  function renderLegalQuality(element, response) {
    const authorshipElement = element.querySelector(".authorship .quality");
    const authorship = response.authorship;
    renderQualityMeasure(authorshipElement, authorship, "award", "bug");

    const databaseAuthorshipElement = element.querySelector(".databaseAuthorship .quality");
    const databaseAuthorship = response.databaseAuthorship;
    renderQualityMeasure(databaseAuthorshipElement, databaseAuthorship, "award", "bug");

    const specialDatabaseElement = element.querySelector(".protectedDatabaseAuthorship .quality");
    const specialDatabaseAuthorship = response.specialDatabaseAuthorship;
    renderQualityMeasure(specialDatabaseElement, specialDatabaseAuthorship, "award", "bug");
  }

  function renderShared(element, response) {
    const mediaTypeElement = element.querySelector(".mediaType .quality");
    const mediaType = response.mediaType;
    renderQualityMeasure(mediaTypeElement, mediaType, "award", "bug");
  }

  function renderDistributionQuality(element, response) {
    const downloadElement = element.querySelector(".download .quality");
    const download = response.download;
    const downloadCors = response.downloadCors;
    renderQualityMeasure(downloadElement, download, "award", "bug");
    renderQualityMeasure(downloadElement, downloadCors, "globe2", "globe2");

    const accessElement = element.querySelector(".access .quality");
    const access = response.access;
    const accessCors = response.accessCors;
    renderQualityMeasure(accessElement, access, "award", "bug");
    renderQualityMeasure(accessElement, accessCors, "globe2", "globe2");

    const schemaElement = element.querySelector(".schema .quality");
    const schema = response.schema;
    const schemaCors = response.schemaCors;
    renderQualityMeasure(schemaElement, schema, "award", "bug");
    renderQualityMeasure(schemaElement, schemaCors, "globe2", "globe2");
  }

  function renderDataServiceQuality(element, response) {
    const endpointDescriptionElement = element.querySelector(".endpointDescription .quality");
    const endpointDescription = response.endpointDescription;
    const endpointDescriptionCors = response.endpointDescriptionCors;
    renderQualityMeasure(endpointDescriptionElement, endpointDescription, "award", "bug");
    renderQualityMeasure(endpointDescriptionElement, endpointDescriptionCors, "globe2", "globe2");

    const endpointUrlElement = element.querySelector(".endpointUrl .quality");
    const endpointUrl = response.endpointUrl;
    const endpointUrlCors = response.endpointUrlCors;
    renderQualityMeasure(endpointUrlElement, endpointUrl, "award", "bug");
    renderQualityMeasure(endpointUrlElement, endpointUrlCors, "globe2", "globe2");

    const conformsToElement = element.querySelector(".conformsTo .quality");
    const conformsTo = response.conformsTo;
    renderQualityMeasure(conformsToElement, conformsTo, "award", "bug");
  }

  /**
   * Find all elements with data-label tag and try to replace the content with
   * translation from SPARQL endpoint.
   */
  function processDataLabel() {
    const language = document.documentElement.lang;
    // For each specified endpoint.
    document.querySelectorAll("[data-sparql-endpoint]").forEach(element => {
      const endpoint = element.dataset.sparqlEndpoint;
      // Find all labels.
      Array.from(element.querySelectorAll("[data-label]")).map((element) => {
        const url = element.innerText;
        const predicate = element.dataset.label;
        const query = `SELECT ?label WHERE { <${url}> <${predicate}> ?label }`
        executeSparqlQuery(endpoint, query).then(response => {
          // Construct language string object.
          const labels = {};
          response.results.bindings
            .map(item => item.label)
            .forEach(item => labels[item["xml:lang"]] = item.value);
          // Set a new label.
          element.innerHTML = labels[language] ?? labels["cs"] ?? labels["en"] ?? url;
        });
      });
    });
  }

  /**
   * @param {string} endpoint
   * @param {string} query
   */
  function executeSparqlQuery(endpoint, query) {
    const url = `${endpoint}?query=${encodeURIComponent(query)}&format=application%2Fsparql-results%2Bjson`;
    return fetch(url).then(response => response.json());
  }

})();
