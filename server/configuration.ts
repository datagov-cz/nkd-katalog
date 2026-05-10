// Load values from .env file and put them into process.env.
import { z } from "zod";

const ConfigurationZod = z.object({
  development: z.boolean(),
  http: z.object({
    port: z.number().positive(),
    host: z.string(),
    /*
     * https://fastify.dev/docs/latest/Reference/Server/#trustproxy
     */
    trustProxy: z.boolean(),
  }),
  server: z.object({
    /**
     * True to set static assets with this application.
     * You should not use this option in production.
     */
    serverAssets: z.boolean(),
    /**
     * Reload templates for every request.
     * You must not use this option in production!
     */
    reloadTemplates: z.boolean(),
    /**
     * Cron expression for cache reloading.
     */
    labelReloadCron: z.string(),
    /**
     * Path to design system directory.
     * Effective only with 'serverAssets' set to true.
     */
    designSystemFolder: z.string(),
  }),
  services: z.object({
    solrUrl: z.string().url(),
    couchDbUrl: z.string().url(),
    /**
     * URL of SPARQL endpoint with quality measures.
     */
    qualitySparqlUrl: z.string().url(),
  }),
  client: z.object({
    catalogFormUrl: z.string().url(),
    applicationFormUrl: z.string().url(),
    suggestionFormUrl: z.string().url(),
    /**
     * Replace {} with publisher URL.
     */
    publisherDashboardDailyTemplate: z.string(),
    /**
     * Replace {} with publisher URL.
     */
    publisherDashboardMonthlyTemplate: z.string(),
    /**
     * Replace {} with publisher URL.
     */
    dereferenceTemplate: z.string(),
    sparqlEditorUrl: z.string().url(),
    sparqlDefaultQuery: z.string(),
    /**
     * Replace {} with publisher URL.
     */
    sparqlClassAndPropertiesTemplate: z.string(),
    /**
     * URL of Matomo instance to report user interaction to.
     */
    matomoUrl: z.string().nullable(),
    /**
     * Value of siteId used for Matomo reporting.
     */
    matomoSiteId: z.string().nullable(),
    /**
     * Link to local catalog validator landing page.
     */
    catalogValidator: z.string(),
    /**
     * Replace {} with catalog endpoint.
     */
    catalogValidatorTemplate: z.string(),
  }),
});

export type Configuration = z.infer<typeof ConfigurationZod>;

const createConfiguration = (): Configuration => {
  return ConfigurationZod.parse({
    development: process.env.NODE_ENV === "development",
    http: {
      port: Number(process.env.PORT ?? "9000"),
      host: process.env.HOST ?? "127.0.0.1",
      trustProxy: false,
    },
    server: {
      serverAssets:
        process.env.NODE_ENV === "development" ||
        process.env.HTTP_SERVE_STATIC === "1",
      reloadTemplates: process.env.NODE_ENV === "development",
      labelReloadCron: process.env.LABEL_CACHE_RELOAD_CRON ?? "0/15 * * * *",
      designSystemFolder: stripTrailingSlash(process.env.DESIGN_SYSTEM_FOLDER),
    },
    services: {
      solrUrl: stripTrailingSlash(process.env.SOLR_URL),
      couchDbUrl: stripTrailingSlash(process.env.COUCHDB_URL),
      qualitySparqlUrl: process.env.QUALITY_SPARQL_URL,
    },
    client: {
      catalogFormUrl: process.env.CLIENT_CATALOG_FORM_URL ?? "",
      applicationFormUrl: process.env.CLIENT_APPLICATION_FORM_URL ?? "",
      suggestionFormUrl: process.env.CLIENT_SUGGESTION_FORM_URL ?? "",
      publisherDashboardDailyTemplate:
        process.env.CLIENT_DASHBOARD_PUBLISHER_DAILY ?? "",
      publisherDashboardMonthlyTemplate:
        process.env.CLIENT_DASHBOARD_PUBLISHER_MONTHLY ?? "",
      dereferenceTemplate: process.env.CLIENT_DEREFERENCE ?? "",
      sparqlEditorUrl: process.env.CLIENT_SPARQL_EDITOR_URL ?? null,
      sparqlDefaultQuery: process.env.CLIENT_SPARQL_DEFAULT_QUERY ?? null,
      sparqlClassAndPropertiesTemplate:
        process.env.CLIENT_DATA_SERVICE_CLASS_AND_PROPERTIES_TEMPLATE ?? null,
      matomoUrl: process.env.CLIENT_MATOMO_URL ?? null,
      matomoSiteId: process.env.CLIENT_MATOMO_SITE_ID ?? null,
      catalogValidator: process.env.CLIENT_CATALOG_VALIDATOR_LANDING_PAGE ?? null,
      catalogValidatorTemplate : process.env.CLIENT_CATALOG_VALIDATOR_RUN_VALIDATION ?? null,
    },
  });
};

function stripTrailingSlash(value: string | undefined) {
  return value?.endsWith("/") ? value.slice(0, -1) : value;
}

const configuration = createConfiguration();
export default configuration;
