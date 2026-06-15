
/**
 * @param {import('../../service/service.mjs').Services} services
 * @param {string[]} languages
 * @returns {Promise<{ publishers: any[] }>}
 */
export async function prepareData(services, languages) {
  let publishers = null;
  let vdf = null;
  // Fetch independent resources in parallel.
  await Promise.all([
    (async () => {
      publishers = await services.solrPublisher.fetchPublishers();
    })(),
    (async () => {
      vdf = await services.couchDbVdf.fetchPublishersVdf();
    })()
  ]);
  //
  addVdfToPublishersInPlace(publishers, vdf);
  await services.label.addLabelToResources(languages, publishers);

  return {
    "publishers": publishers,
  };
};

function addVdfToPublishersInPlace(publishers, vdf) {
  // Collect publishers and originators.
  const vdfOriginators = new Set();
  const vdfPublishers = new Set();
  for (const item of vdf) {
    if (item.vdfOriginator) {
      vdfOriginators.add(item.iri);
    }
    if (item.vdfPublisher) {
      vdfPublishers.add(item.iri);
    }
  }
  //
  for (const publisher of publishers) {
    publisher["vdfOriginator"] = vdfOriginators.has(publisher.iri);
    publisher["vdfPublisher"] = vdfPublishers.has(publisher.iri);
  }
}
