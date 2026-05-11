import { createDefaultSolrConnector } from "../connector/solr-connector";
import { createCouchDbConnector } from "../connector/couchdb.mjs";
import { createSparqlConnector } from "../connector/sparql.mjs";

import { createCouchDbDataset } from "../data-source/couchdb-dataset.mjs";
import { createCouchDbLabel } from "../data-source/couchdb-label.mjs";
import { createCouchDbSuggestions } from "../data-source/couchdb-suggestions.mjs";
import { createSolrApplication } from "../data-source/solr-application.mjs";
import { createSolrSuggestion } from "../data-source/solr-suggestion.mjs";
import { createCouchDbStatic } from "../data-source/couchdb-static.mjs";
import { createSolrPublisher } from "../data-source/solr-publisher.mjs";
import { createCouchDbCatalog } from "../data-source/couchdb-catalog.mjs";
import { createSolrDataset } from "../data-source/solr-dataset.mjs";
import { createSparqlQuality } from "../data-source/sparql-quality.mjs";
import { createCouchDbVdf } from "../data-source/couchdb-vdf.mjs";

import { createNavigationService } from "./navigation-service.mjs";
import { createLabelService } from "./label-service.ts";
import { createFacetService } from "./facet-service.mjs";
import { createDatasetService } from "./dataset-service.mjs";
import { createCronService } from "./cron-service.mjs";
import { createLinkService } from "./link-service.mjs";

export async function createServices(configuration, http) {
  const solr = createDefaultSolrConnector(http, configuration.services.solrUrl);
  const couchdb = createCouchDbConnector(configuration.services.couchDbUrl, http);

  const couchDbDataset = createCouchDbDataset(couchdb);
  const couchDbLabel = createCouchDbLabel(couchdb);
  const couchDbStatic = createCouchDbStatic(couchdb);
  const couchDbSuggestions = createCouchDbSuggestions(couchdb);
  const couchDbLocalCatalog = createCouchDbCatalog(couchdb);
  const couchDbVdf = createCouchDbVdf(couchdb);

  const solrApplication = createSolrApplication(solr);
  const solrSuggestion = createSolrSuggestion(solr);
  const solrPublisher = createSolrPublisher(solr);
  const solrDataset = createSolrDataset(solr);

  const sparqlQuality = createSparqlQuality(
    createSparqlConnector(configuration.services.qualitySparqlUrl, http));

  const navigation = createNavigationService();
  const label = createLabelService(
    [couchDbLabel, couchDbSuggestions],
    [couchDbStatic, couchDbSuggestions]);
  const facet = createFacetService(label);
  const dataset = createDatasetService(couchDbDataset);
  const link = createLinkService(configuration);

  await loadLabelCache(label);

  // Start time-based services.
  createCronService(configuration, label).initialize();

  return {
    // Data sources
    "couchDbDataset": couchDbDataset,
    "couchDbLabel": couchDbDataset,
    "couchDbStatic": couchDbStatic,
    "couchDbSuggestions": couchDbSuggestions,
    "couchDbLocalCatalog": couchDbLocalCatalog,
    "couchDbVdf": couchDbVdf,
    "solrApplication": solrApplication,
    "solrSuggestion": solrSuggestion,
    "solrPublisher": solrPublisher,
    "solrDataset": solrDataset,
    "sparqlQuality": sparqlQuality,
    // Services
    "navigation": navigation,
    "label": label,
    "facet": facet,
    "dataset": dataset,
    "link": link,
    // Configuration
    "configuration": configuration,
  };
}

async function loadLabelCache(label) {
  const status = await label.reloadCache(["cs", "en"]);
  if (status === true) {
    return;
  }
  // Reload has failed, we try again.
  setTimeout(() => {
    loadLabelCache(label);
  }, 5000);
}
