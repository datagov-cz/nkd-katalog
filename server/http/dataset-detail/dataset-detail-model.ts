import { CouchDbDatasetSource } from "../../data-source/couchdb-dataset.ts";
import { SolrApplicationService } from "../../data-source/solr-application.mjs";
import { SolrDatasetService } from "../../data-source/solr-dataset.mjs";
import { Language } from "../../localization/index.ts";
import { LanguageString } from "../../rdf/rdf-model.ts";
import { LabelService } from "../../service/label-service.ts";
import { EUA, SGOV } from "../../data-source/shared/vocabulary.ts";
import { Distribution } from "../../dcat-ap-cz/index.ts";
import { createLanguageSelector } from "../../service/language-selector.ts";

export async function prepareDatasetDetailViewModel(
  services: {
    couchDbDataset: CouchDbDatasetSource,
    label: LabelService,
    solrApplication: SolrApplicationService,
    solrDataset: SolrDatasetService,
  },
  languages: Language[],
  query: {
    iri: string,
    distributionPage: number,
    distributionPageSize: number,
  },
): Promise<DatasetDetailViewModel> {

  // TODO Check for catalog and catalogRecord

  const { dataset, catalog, catalogRecord, publicSystem } =
    await services.couchDbDataset.fetchDataset(query.iri);

  const applications = await services.solrApplication
    .fetchApplicationsWithDatasets(languages, [query.iri]);

  const series = await services.solrDataset.fetchDatasets(languages, {
    searchQuery: "",
    publisher: [],
    theme: [],
    keyword: [],
    format: [],
    dataServiceType: [],
    temporalStart: null,
    temporalEnd: null,
    vdfCodelist: null,
    vdfPublicData: null,
    isPartOf: [query.iri],
    sort: "title",
    sortDirection: "asc",
    offset: query.distributionPage * query.distributionPageSize,
    limit: query.distributionPageSize,
    applicableLegislation: [],
    datasetType: [],
    hvdCategory: [],
    dataset_type: []
  });

  // Fetch information about in series datasets.
  const inSeries = (await Promise.all(dataset.inSeries
    .map(iri => services.couchDbDataset.fetchDatasetPreview(iri))))
    .filter(item => item !== null);

  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  const lang = createLanguageSelector(languages);
  const labels = createLabelFetcher(services.label, languages);

  const language = languages[0];
  const publisher = first(dataset.publisher);
  const temporal = first(dataset.temporal);

  const themes: Link[] = [];
  const euroVocThemes: Link[] = [];
  // This was introduced as part of KODI prototype but is not being used.
  const semanticThemes: Link[] = [];
  dataset.theme.forEach(item => {
    if (item.inScheme.includes(EUA.dataTheme)) {
      themes.push(labels.wrap(item.iri));
    } else if (item.inScheme.includes(SGOV.ObjectType)) {
      semanticThemes.push(labels.wrap(item.iri));
    } else {
      euroVocThemes.push(labels.wrap(item.iri))
    }
  });

  const result: DatasetDetailViewModel = {
    dataset: {
      iri: dataset.iri,
      type: dataset.type,
      title: lang(dataset.title),
      tags: [], // TODO
      // We do not use label from the dataset as it is not part of the data.
      publisher: labels.wrap(publisher.iri),
      applicableLegislation: dataset.applicableLegislation
        .map(item => ({ url: item })),
      keywords: dataset.keyword
        .map(item => item[language])
        .filter(item => item !== undefined),
      description: lang(dataset.description),
      themes,
      euroVocThemes,
      spatial: dataset.spatial.map(labels.wrap),
      spatialResolutionInMeters: first(dataset.spatialResolutionInMeters),
      temporal: temporal === null ? null : {
        iri: temporal.iri,
        startDate: temporal.startDate,
        endDate: temporal.endDate,
      },
      temporalResolution: first(dataset.temporalResolution),
      documentation: dataset.documentation
        .map(item => ({ url: item })),
      contact: dataset.contactPoint.map(agent => ({
        email: first(agent.email),
        label: lang(agent.title),
      })),
      conformsTo: dataset.conformsTo.map(labels.wrap),
      frequency: labels.wrapFirst(dataset.frequency),
      hvdCategory: dataset.hvdCategory.map(labels.wrap),
      partOfSeries: first(inSeries.map(item => ({
        url: item.iri,
        label: lang(item.title),
      }))),
      landingPage: dataset.landingPage.map(item => ({ url: item })),
      publicInformationSystem: publicSystem === null ? [] : [
        labels.wrap(publicSystem.iri)
      ],
      localCatalog: dataset.localCatalog
        .map(item => ({ url: item })),
      concernTerm: dataset.concernTerm.map(labels.wrap),
    },
    distributions: dataset.distributions
      .map(item => asDistributable(lang, labels, item))
      .toSorted((left, right) => left.iri.localeCompare(right.iri)),
    applications: {
      // TODO Add support for pagination.
      found: applications.length,
      items: applications.map(item => ({
        iri: item.iri,
        title: item.title,
        description: item.description,
      })),
    },
    series: {
      found: series.found,
      items: series.documents.map(item => ({
        iri: item.iri,
        title: item.title,
        description: item.description,
      })),
    },
  };

  // Update labels before returning the data.
  await labels.fetch();

  return result;
}

/**
 * Model with all data necessary to render dataset detail page.
 */
export interface DatasetDetailViewModel {

  dataset: {

    iri: string;

    type: string[];

    title: string | null;

    tags: Link[];

    publisher: Link;

    applicableLegislation: { url: string }[];

    keywords: string[];

    description: string;

    themes: Link[];

    euroVocThemes: Link[];

    spatial: Link[];

    spatialResolutionInMeters: number | null;

    temporal: {

      iri: string;

      startDate: Date | null;

      endDate: Date | null;

    } | null;

    temporalResolution: string | null;

    documentation: { url: string }[];

    contact: {

      email: string | null;

      label: string | null;

    }[];

    conformsTo: Link[];

    frequency: Link | null;

    hvdCategory: Link[];

    partOfSeries: Link | null;

    landingPage: { url: string }[];

    publicInformationSystem: Link[];

    localCatalog: { url: string }[];

    concernTerm: Link[];

  };

  distributions: Distributable[];

  applications: {

    found: number;

    items: {

      iri: string;

      title: string | null;

      description: string | null;

    }[];

  };

  series: {

    found: number;

    items: {

      iri: string;

      title: string | null;

      description: string | null;

    }[];

  };

}

interface Link {

  url: string;

  label: string | null;

}

export interface FileDistribution extends Distributable {

  type: "FileDistribution";

  downloadUrl: string | null;

  mediaType: Link[];

  compressFormat: Link[];

  packageFormat: Link[];

  title: string | null;

  tags: Link[];

  applicableLegislation: { url: string }[];

  format: Link | null;

  accessUrl: string | null;

  schema: { url: string }[];

  sharedInterfaceContentType: Link[];

  sharedInterfaceKind: Link[];

  sharedInterfaceAccessType: Link[];

  facilitatesSharing: FacilitatesSharing[];

  conformsTo: string[];

}

export function isFileDistribution(
  what: Distributable,
): what is FileDistribution {
  return what.type === "FileDistribution";
}

/**
 * Just a base class for {@link FileDistribution} and {@link DataService}.
 */
export interface Distributable {

  iri: string;

  type: string;

  termsOfUse: TermsOfUse | null;

}

type TermsOfUse = {

  type: "DcatAp";

  license: string;

} | {

  type: "DcatApCz";

  authorship: string | null;

  author: string | null;

  databaseAuthorship: string | null;

  databaseAuthor: string | null;

  protectedDatabaseAuthorship: string | null;

  protectedDatabaseAuthor: string | null;

  containsPersonalData: string | null;

};

interface FacilitatesSharing {

  sharedAs: Link | null;

  sharedBy: Link | null;

  obtainedBy: Link | null;

  correspondingTerm: Link | null;

}

/**
 * TODO Data service should exists inside Distribution not as a replacement.
 */
export interface DataService extends Distributable {

  type: "DataService";

  format: Link | null;

  title: string | null;

  tags: Link[];

  applicableLegislation: { url: string }[];

  endpointDescription: string | null;

  endpointUrl: string;

  contact: {

    email: string | null;

    label: string | null;

  }[];

  documentation: string[];

  accessUrl: string | null;

  schema: { url: string }[];

  sharedInterfaceContentType: Link[];

  sharedInterfaceKind: Link[];

  sharedInterfaceAccessType: Link[];

  facilitatesSharing: FacilitatesSharing[];

  conformsTo: string[];

}

export function isDataService(
  what: Distributable,
): what is DataService {
  return what.type === "DataService";
}

function createLabelFetcher(
  labelService: LabelService,
  languages: Language[],
): LabelFetcher {
  const backlog: Link[] = [];
  return {
    wrap(iri: string): Link {
      const result: Link = { url: iri, label: null };
      backlog.push(result);
      return result;
    },
    wrapFirst(iris) {
      if (iris.length === 0) {
        return null;
      }
      const result: Link = { url: iris[0], label: null };
      backlog.push(result);
      return result;
    },
    fetch: async () => {
      for (const item of backlog) {
        item.label = await labelService.fetchLabel(languages, item.url);
      }
    }
  }
}

interface LabelFetcher {

  wrap(iri: string): Link;

  wrapFirst(iris: string[]): Link | null;

  /**
   * Fetch all labels and set them at one.
   */
  fetch(): Promise<void>;

}

function first<Type>(items: Type[]): Type | null {
  return items.length === 0 ? null : items[0];
}

function asDistributable(
  lang: (value: LanguageString) => string,
  labels: LabelFetcher,
  distribution: Distribution,
): Distributable {

  const dataService = first(distribution.dataService);
  const termsOfUse = first(distribution.termsOfUse);

  if (dataService === null) {
    // If there is no data service, we just load all from the distribution.
    const result: FileDistribution = {
      type: "FileDistribution",
      iri: distribution.iri,
      title: lang(distribution.title),
      tags: [],
      format: labels.wrapFirst(distribution.format),
      applicableLegislation: distribution.applicableLegislation
        .map(item => ({ url: item }))
        .toSorted((left, right) => left.url.localeCompare(right.url)),
      accessUrl: first(distribution.accessUrl),
      termsOfUse: termsOfUse === null ? (
        distribution.license.length === 0 ? null : ({
          type: "DcatAp",
          license: first(distribution.license),
        })
      ) : ({
        type: "DcatApCz",
        author: first(termsOfUse.author),
        authorship: first(termsOfUse.authorship),
        databaseAuthor: first(termsOfUse.databaseAuthor),
        databaseAuthorship: first(termsOfUse.databaseAuthorship),
        protectedDatabaseAuthor: first(termsOfUse.protectedDatabase),
        protectedDatabaseAuthorship: first(termsOfUse.protectedDatabase),
        containsPersonalData: first(termsOfUse.personalData),
      }),
      schema: distribution.conformsTo
        .map(item => ({ url: item })),
      mediaType: distribution.mediaType
        .map(item => labels.wrap(item)),
      compressFormat: distribution.compressFormat
        .map(item => labels.wrap(item)),
      packageFormat: distribution.packageFormat
        .map(item => labels.wrap(item)),
      sharedInterfaceAccessType: distribution.sharedInterfaceAccessType
        .map(item => labels.wrap(item)),
      sharedInterfaceContentType: distribution.sharedInterfaceContentType
        .map(item => labels.wrap(item)),
      sharedInterfaceKind: distribution.sharedInterfaceKind
        .map(item => labels.wrap(item)),
      facilitatesSharing: distribution.facilitatesSharing.map(item => ({
        correspondingTerm: labels.wrapFirst(item.correspondingTerm),
        obtainedBy: labels.wrapFirst(item.obtainedBy),
        sharedAs: labels.wrapFirst(item.sharedAs),
        sharedBy: labels.wrapFirst(item.sharedBy),
      })),
      conformsTo: distribution.conformsTo,
      downloadUrl: first(distribution.downloadURL),
    };
    return result;
  } else {
    // If there is a data service, we keep only the terms of use.
    const result: DataService = {
      type: "DataService",
      // Loading from distribution
      format: labels.wrapFirst(distribution.format),
      applicableLegislation: distribution.applicableLegislation
        .map(item => ({ url: item }))
        .toSorted((left, right) => left.url.localeCompare(right.url)),
      accessUrl: first(distribution.accessUrl),
      termsOfUse: termsOfUse === null ? (
        distribution.license.length === 0 ? null : ({
          type: "DcatAp",
          license: first(distribution.license),
        })
      ) : ({
        type: "DcatApCz",
        author: first(termsOfUse.author),
        authorship: first(termsOfUse.authorship),
        databaseAuthor: first(termsOfUse.databaseAuthor),
        databaseAuthorship: first(termsOfUse.databaseAuthorship),
        protectedDatabaseAuthor: first(termsOfUse.protectedDatabase),
        protectedDatabaseAuthorship: first(termsOfUse.protectedDatabase),
        containsPersonalData: first(termsOfUse.personalData),
      }),
      sharedInterfaceAccessType: distribution.sharedInterfaceAccessType
        .map(item => labels.wrap(item)),
      sharedInterfaceContentType: distribution.sharedInterfaceContentType
        .map(item => labels.wrap(item)),
      sharedInterfaceKind: distribution.sharedInterfaceKind
        .map(item => labels.wrap(item)),
      facilitatesSharing: distribution.facilitatesSharing.map(item => ({
        correspondingTerm: labels.wrapFirst(item.correspondingTerm),
        obtainedBy: labels.wrapFirst(item.obtainedBy),
        sharedAs: labels.wrapFirst(item.sharedAs),
        sharedBy: labels.wrapFirst(item.sharedBy),
      })),
      // Loading from data service
      iri: dataService.iri,
      title: lang(dataService.title),
      tags: [],
      schema: dataService.conformsTo
        .map(item => ({ url: item })),
      conformsTo: dataService.conformsTo,
      endpointDescription: first(dataService.endpointDescription),
      endpointUrl: first(dataService.endpointUrl),
      contact: dataService.contactPoint.map(agent => ({
        email: first(agent.email),
        label: lang(agent.title),
      })),
      documentation: dataService.documentation,
    };
    return result;
  }
}
