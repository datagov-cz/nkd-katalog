import { CouchDbConnector } from "../connector/couchdb-connector.ts";
import {
  Catalog, CatalogRecord, Dataset, jsonLdToCatalog,
  jsonLdToCatalogRecord, jsonLdToDataset,
  jsonLdToPublicAdministrationInformationSystem,
  PublicAdministrationInformationSystem,
} from "../dcat-ap-cz/index.ts";
import { parseJsonLd } from "../rdf/index.ts";
import { DCAT, LEGISLATION } from "./shared/vocabulary.ts";

export function createCouchDbDatasetSource(
  couchDb: CouchDbConnector,
): CouchDbDatasetSource {
  return {
    fetchDataset: (iri) => fetchDataset(couchDb, iri),
    fetchDatasetPreview: (iri) => fetchDatasetPreview(couchDb, iri),
  };
}

export interface CouchDbDatasetSource {

  fetchDataset(iri: string): Promise<CouchDbDatasetEntry>;

  fetchDatasetPreview(iri: string) : Promise<Dataset | null>;

}

export interface CouchDbDatasetEntry {

  dataset: Dataset | null;

  catalog: Catalog | null;

  catalogRecord: CatalogRecord | null;

  publicSystem: PublicAdministrationInformationSystem | null;

}

const COUCHDB_DATABASE_NAME = "dataset";

async function fetchDataset(
  couchDb: CouchDbConnector, iri: string,
): Promise<CouchDbDatasetEntry | null> {
  const response = await couchDb.fetch(COUCHDB_DATABASE_NAME, iri);
  if (response.error) {
    return null;
  }
  const reader = await parseJsonLd(response.jsonld);

  const datasets = reader.allOfType(DCAT.Dataset)
    .filter(reader => reader.identifier().value === iri)
    .map(reader => jsonLdToDataset(reader));

  const catalogs = reader.allOfType(DCAT.Catalog)
    .map(reader => jsonLdToCatalog(reader));

  const catalogRecords = reader.allOfType(DCAT.CatalogRecord)
    .map(reader => jsonLdToCatalogRecord(reader));

  // There is no type here so we search using a reverse property.
  const publicSystems = reader.all()
    .filter(reader => reader.values(LEGISLATION.includes).includes(iri))
    .map(reader => jsonLdToPublicAdministrationInformationSystem(reader));

  return {
    dataset: datasets[0] ?? null,
    catalog: catalogs[0] ?? null,
    catalogRecord: catalogRecords[0] ?? null,
    publicSystem: publicSystems[0] ?? null,
  }
}

async function fetchDatasetPreview(
  couchDb: CouchDbConnector, iri: string,
) : Promise<Dataset | null> {
  const response = await couchDb.fetch(COUCHDB_DATABASE_NAME, iri);

  if (response.error) {
    return null;
  }
  const reader = await parseJsonLd(response.jsonld);

  const datasets = reader.allOfType(DCAT.Dataset)
    .filter(reader => reader.identifier().value === iri)
    .map(reader => jsonLdToDataset(reader));

  if (datasets.length === 0) {
    return null;
  }

  return datasets[0];
}
