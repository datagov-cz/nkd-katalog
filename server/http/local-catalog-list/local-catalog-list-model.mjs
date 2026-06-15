
/**
 * @param {import('../../service/service.mjs').Services} services
 * @param {('cs' | 'en')[]} languages
 * @returns {Promise<{ catalogs: import('../../data-source/couchdb-catalog.mjs').LocalCatalog[] | null }>}
 */
export async function prepareData(services, languages) {
  const catalogs = await services.couchDbLocalCatalog.fetchCatalogs(languages);
  // Collect all publisher objects into a temporary array and assign labels.
  const publishers = catalogs.map(catalog => catalog.publisher);
  await services.label.addLabelToResources(languages, publishers);
  return {
    "catalogs": catalogs,
  };
};
