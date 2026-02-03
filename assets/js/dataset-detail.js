window.addEventListener("load", () => {
  initializeApplicableLegislation();
  initializeQuality();
});

function initializeApplicableLegislation() {
  const modalElement = document.getElementById("legislation-list-modal");
  let originalParent = null;
  //
  const showModal = (event) => {
    if (originalParent !== null) {
      // We need to move current content back.
      originalParent.appendChild(
        modalElement.querySelector(".gov-modal__content ul"),
      );
    }
    // Move selected content into the dialog.
    const content = event.target.querySelector("ul");
    originalParent = content.parentElement;
    modalElement.querySelector(".gov-modal__content").replaceChildren(content);
    modalElement.setAttribute("open", "true");
  };
  document
    .querySelectorAll(".applicable-legislation .legislation-list")
    .forEach((element) => element.addEventListener("gov-click", showModal));
}

function initializeQuality() {
  const language = document.documentElement.lang;
  const datasetElement = document.querySelector(".dataset-container[data-iri]");
  fetchAndRenderDatasetQuality(
    language,
    datasetElement,
    datasetElement.dataset.iri,
  );

  const distributionElements = document.querySelectorAll(
    ".distribution-item-wrap[data-iri]",
  );
  distributionElements.forEach((element) =>
    fetchAndRenderDistributionQuality(language, element, element.dataset.iri),
  );
}

async function fetchAndRenderDatasetQuality(language, element, iri) {
  const response = await fetchQuality(language, iri);

  const documentationElement = element.querySelector(".documentation .quality");
  const documentation = response.documentation;
  renderQualityMeasure(
    documentationElement,
    documentation,
    "link",
    "link-45deg",
  );

  const specificationElement = element.querySelector(".specification .quality");
  const specification = response.specification;
  renderQualityMeasure(
    specificationElement,
    specification,
    "link",
    "link-45deg",
  );
}

function fetchQuality(language, iri) {
  const url =
    "/api/v2/catalog/v1/quality?iri=" +
    encodeURIComponent(iri) +
    "&language=" +
    encodeURIComponent(language);
  return fetch(url).then((response) => response.json());
}

function renderQualityMeasure(
  element,
  measure,
  successIconName,
  failedIconName,
) {
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
  return createQualityIcon(name, "alright", message);
}

function createQualityIcon(iconName, iconClass, message) {
  const iconElement = document.createElement("gov-icon");
  iconElement.setAttribute("name", iconName);
  iconElement.setAttribute("type", "bootstrap");
  iconElement.classList.add(iconClass);

  const contentElement = document.createElement("gov-tooltip-content");
  contentElement.textContent = message;

  const tooltipElement = document.createElement("gov-tooltip");
  tooltipElement.appendChild(iconElement);
  tooltipElement.appendChild(contentElement);
  return tooltipElement;
}

function createFailedQualityIcon(name, message) {
  return createQualityIcon(name, "danger", message);
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

  const databaseAuthorshipElement = element.querySelector(
    ".databaseAuthorship .quality",
  );
  const databaseAuthorship = response.databaseAuthorship;
  renderQualityMeasure(
    databaseAuthorshipElement,
    databaseAuthorship,
    "award",
    "bug",
  );

  const specialDatabaseElement = element.querySelector(
    ".protectedDatabaseAuthorship .quality",
  );
  const specialDatabaseAuthorship = response.specialDatabaseAuthorship;
  renderQualityMeasure(
    specialDatabaseElement,
    specialDatabaseAuthorship,
    "award",
    "bug",
  );
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

  const schemaElement = element.querySelector(".schema .quality");
  const schema = response.schema;
  const schemaCors = response.schemaCors;
  renderQualityMeasure(schemaElement, schema, "award", "bug");
  renderQualityMeasure(schemaElement, schemaCors, "globe2", "globe2");
}

function renderDataServiceQuality(element, response) {
  const endpointDescriptionElement = element.querySelector(
    ".endpointDescription .quality",
  );
  const endpointDescription = response.endpointDescription;
  const endpointDescriptionCors = response.endpointDescriptionCors;
  renderQualityMeasure(
    endpointDescriptionElement,
    endpointDescription,
    "award",
    "bug",
  );
  renderQualityMeasure(
    endpointDescriptionElement,
    endpointDescriptionCors,
    "globe2",
    "globe2",
  );

  const endpointUrlElement = element.querySelector(".endpointUrl .quality");
  const endpointUrl = response.endpointUrl;
  const endpointUrlCors = response.endpointUrlCors;
  renderQualityMeasure(endpointUrlElement, endpointUrl, "award", "bug");
  renderQualityMeasure(endpointUrlElement, endpointUrlCors, "globe2", "globe2");

  const conformsToElement = element.querySelector(".conformsTo .quality");
  const conformsTo = response.conformsTo;
  renderQualityMeasure(conformsToElement, conformsTo, "award", "bug");
}
