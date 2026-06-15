
/**
 * @param {import('../../service/service.mjs').Services} services
 * @param {string[]} languages
 * @param {any} query
 * @returns {Promise<any>}
 */
export async function prepareData(services, languages, query) {
  const data = await services.solrApplication.fetchApplications(languages, {
    "searchQuery": query.searchQuery,
    "state": query.state,
    "platform": query.platform,
    "theme": query.theme,
    "type": query.type,
    "sort": query.sort,
    "sortDirection": query.sortDirection,
    "offset": query.page * query.pageSize,
    "limit": query.pageSize,
  });

  const facets = data["facets"];

  data["found"] = {
    "documents": data["found"],
    "state": facets["state"].length,
    "platform": facets["platform"].length,
    "theme": facets["theme"].length,
    "type": facets["type"].length,
  };

  await updateApplicationsInPlace(services, languages, data["documents"]);

  await services.facet.updateFacetInPlace(
    languages, facets["state"], query["state"], query["stateLimit"]);
  await services.facet.updateFacetInPlace(
    languages, facets["platform"], query["platform"], query["platformLimit"]);
  await services.facet.updateFacetInPlace(
    languages, facets["theme"], query["theme"], query["themeLimit"]);
  await services.facet.updateFacetInPlace(
    languages, facets["type"], query["type"], query["typeLimit"]);

  return data;
}

async function updateApplicationsInPlace(services, languages, documents) {
  for (const document of documents) {
    document["themes"] = document["themes"].map(iri => ({ "iri": iri }));
    await services.label.addLabelToResources(languages, document["themes"]);
  }
}
