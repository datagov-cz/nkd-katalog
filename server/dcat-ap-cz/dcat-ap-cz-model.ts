import { SubjectReader } from "../rdf/index.ts";
import {
  DCTERMS, DCAT, VCARD, SKOS, ADMS, FOAF, OWL, NKOD, PU, SPDX,
  EUROPE, LEGISLATION,
} from "../data-source/shared/vocabulary.ts";

export function jsonLdToDataset(reader: SubjectReader): Dataset {
  return {
    iri: reader.identifier().value,
    type: reader.types(),
    title: reader.languageString(DCTERMS.title),
    description: reader.languageString(DCTERMS.description),
    contactPoint: reader.subjects(DCAT.contactPoint).map(jsonLdToAgent),
    distributions: reader.subjects(DCAT.distribution).map(jsonLdToDistribution),
    keyword: reader.languageStrings(DCAT.keyword),
    publisher: reader.subjects(DCTERMS.publisher).map(jsonLdToAgent),
    theme: reader.subjects(DCAT.theme).map(jsonLdToTheme),
    temporal: reader.subjects(DCTERMS.temporal).map(jsonLdToTemporal),
    accessRight: reader.values(DCTERMS.accessRights),
    conformsTo: reader.values(DCTERMS.conformsTo),
    documentation: reader.values(FOAF.page),
    frequency: reader.values(DCTERMS.accrualPeriodicity),
    hasVersion: reader.values(DCTERMS.hasVersion),
    identifier: reader.values(DCTERMS.identifier),
    versionOf: reader.values(DCTERMS.isVersionOf),
    landingPage: reader.values(DCAT.landingPage),
    language: reader.values(DCTERMS.language),
    otherIdentifier: reader.subjects(ADMS.identifier).map(jsonLdToIdentifier),
    provenance: reader.values(DCTERMS.provenance),
    relation: reader.values(DCTERMS.relation),
    issued: reader.values(DCTERMS.issued),
    sample: reader.values(ADMS.sample),
    source: reader.values(DCTERMS.source),
    spatial: reader.values(DCTERMS.spatial),
    modified: reader.values(DCTERMS.modified),
    version: reader.values(OWL.versionInfo),
    versionNotes: reader.values(ADMS.versionNotes),
    temporalResolution: reader.values(DCAT.temporalResolution),
    spatialResolutionInMeters: reader.numbers(DCAT.spatialResolutionInMeters),
    applicableLegislation: reader.values(EUROPE.applicableLegislation),
    hvdCategory: reader.values(EUROPE.hvdCategory),
    concernTerm: reader.values(LEGISLATION.concernTerm),
    part: reader.values(DCTERMS.hasPart),
    inSeries: reader.values(DCAT.inSeries),
    localCatalog: reader.values(NKOD.lkod),
    vdfOriginator: reader.values(DCTERMS.creator),
  }
}

export interface Dataset {

  /* @lc-property @id */
  iri: string;

  /* @lc-property @type */
  type: string[];

  /* @lc-property http://purl.org/dc/terms/title */
  title: LanguageString | null;

  /* @lc-property "http://purl.org/dc/terms/description */
  description: LanguageString | null;

  /* @lc-property http://www.w3.org/ns/dcat#contactPoint */
  contactPoint: Agent[],

  /* @lc-property http://www.w3.org/ns/dcat#distribution */
  distributions: Distribution[];

  /* @lc-property http://www.w3.org/ns/dcat#keyword */
  keyword: LanguageString[];

  /* @lc-property http://purl.org/dc/terms/publisher */
  publisher: Agent[];

  /* @lc-property http://www.w3.org/ns/dcat#theme */
  theme: Theme[];

  /* @lc-property http://purl.org/dc/terms/accessRights */
  accessRight: string[];

  /* @lc-property http://purl.org/dc/terms/conformsTo */
  conformsTo: string[];

  /* @lc-property http://xmlns.com/foaf/0.1/page */
  documentation: string[];

  /* @lc-property http://purl.org/dc/terms/accrualPeriodicity */
  frequency: string[];

  /* @lc-property http://purl.org/dc/terms/identifier */
  identifier: string[];

  /* @lc-property http://purl.org/dc/terms/hasVersion */
  hasVersion: string[];

  /* @lc-property http://purl.org/dc/terms/isVersionOf */
  versionOf: string[];

  /* @lc-property http://www.w3.org/ns/dcat#landingPage */
  landingPage: string[];

  /* @lc-property http://purl.org/dc/terms/language */
  language: string[];

  /* @lc-property http://www.w3.org/ns/adms#identifier */
  otherIdentifier: Identifier[];

  /* @lc-property http://purl.org/dc/terms/provenance */
  provenance: string[];

  /* @lc-property http://purl.org/dc/terms/relation */
  relation: string[];

  /* @lc-property http://www.w3.org/ns/dcat#issued */
  issued: string[];

  /* @lc-property http://www.w3.org/ns/adms#sample */
  sample: string[];

  /* @lc-property http://purl.org/dc/terms/source */
  source: string[];

  /* @lc-property http://purl.org/dc/terms/spatial */
  spatial: string[];

  /* @lc-property http://www.w3.org/ns/dcat#spatialResolutionInMeters */
  spatialResolutionInMeters: number[];

  /* @lc-property http://purl.org/dc/terms/temporal */
  temporal: Temporal[];

  /* @lc-property http://www.w3.org/ns/dcat#temporalResolution */
  temporalResolution: string[];

  /* @lc-property http://purl.org/dc/terms/modified */
  modified: string[];

  /* @lc-property http://www.w3.org/2002/07/owl#versionInfo */
  version: string[];

  /* @lc-property http://www.w3.org/ns/adms#versionNotes */
  versionNotes: string[];

  /* @lc-property http://purl.org/dc/terms/hasPart */
  part: string[];

  /* @lc-property http://www.w3.org/ns/dcat#inSeries */
  inSeries: string[];

  /* @lc-property https://data.gov.cz/slovník/nkod/lkod */
  localCatalog: string[];

  /* @lc-property http://purl.org/dc/terms/creator */
  vdfOriginator: string[];

  /* @lc-property http://data.europa.eu/r5r/applicableLegislation */
  applicableLegislation: string[];

  /* @lc-property http://data.europa.eu/r5r/hvdCategory */
  hvdCategory: string[];

  /* @lc-property https://slovník.gov.cz/legislativní/sbírka/360/2023/pojem/týká-se-pojmu */
  concernTerm: string[];

}

type LanguageString = { [language: string]: string };

export interface Theme {

  /* @lc-property @id */
  iri: string;

  /* @lc-property http://www.w3.org/2004/02/skos/core#inScheme */
  inScheme: string[];

}

export interface Agent {

  /* @lc-property @id */
  iri: string;

  /* @lc-property http://www.w3.org/2006/vcard/ns#fn */
  title: LanguageString | null;

  /* @lc-property http://www.w3.org/2006/vcard/ns#hasEmail */
  email: string[];

}

export interface Identifier {

  /* @lc-property @id */
  iri: string;

  /* @lc-property @type */
  type: string[];

  /* @lc-property http://www.w3.org/2004/02/skos/core#notation */
  notation: string[];

  /* @lc-property http://purl.org/dc/terms/creator */
  creator: string[];

}

export interface Temporal {

  /* @lc-property @id */
  iri: string;

  /* @lc-property http://www.w3.org/ns/dcat#startDate */
  startDate: Date | null;

  /* @lc-property http://www.w3.org/ns/dcat#endDate */
  endDate: Date | null;

}

export interface Distribution {

  /* @lc-property @id */
  iri: string;

  /* @lc-property @type */
  type: string[];

  /* @lc-property http://purl.org/dc/terms/title */
  title: LanguageString | null;

  /* @lc-property "http://purl.org/dc/terms/description */
  description: LanguageString | null;

  /* @lc-property http://www.w3.org/ns/dcat#accessURL */
  accessUrl: string[];

  /* @lc-property http://purl.org/dc/terms/format */
  format: string[];

  /* @lc-property http://www.w3.org/ns/dcat#mediaType */
  mediaType: string[];

  /* @lc-property http://purl.org/dc/terms/conformsTo */
  conformsTo: string[];

  /* @lc-property http://purl.org/dc/terms/license */
  license: string[];

  /* @lc-property http://www.w3.org/ns/dcat#byteSize */
  byteSize: string[];

  /* @lc-property http://spdx.org/rdf/terms#checksum */
  checksum: string[];

  /* @lc-property http://www.w3.org/ns/dcat#compressFormat */
  compressFormat: string[];

  /* @lc-property http://www.w3.org/ns/dcat#packageFormat */
  packageFormat: string[];

  /* @lc-property http://data.europa.eu/r5r/applicableLegislation */
  applicableLegislation: string[];

  /* @lc-property https://data.gov.cz/slovník/podmínky-užití/specifikace */
  termsOfUse: TermsOfUse[];

  /* @lc-property https://slovník.gov.cz/legislativní/sbírka/360/2023/pojem/má-typ-obsahu-sdíleného-rozhraním */
  sharedInterfaceContentType: string[];

  /* @lc-property https://slovník.gov.cz/legislativní/sbírka/360/2023/pojem/má-způsob-sdílení-rozhraním */
  sharedInterfaceKind: string[];

  /* @lc-property https://slovník.gov.cz/legislativní/sbírka/360/2023/pojem/má-způsob-získání-dat-sdílených-rozhraním */
  sharedInterfaceAccessType: string[];

  /* @lc-property  https://slovník.gov.cz/legislativní/sbírka/360/2023/pojem/zprostředkovává-sdílení */
  facilitatesSharing: FacilitatedSharing[];

  /* @lc-property http://www.w3.org/ns/dcat#accessService */
  dataService: DataService[];

  /* @lc-property http://xmlns.com/foaf/0.1/page */
  documentation: string[];

  /* @lc-property http://www.w3.org/ns/dcat#downloadURL */
  downloadURL: string[];

  /* @lc-property http://purl.org/dc/terms/language */
  language: string[];

  /* @lc-property http://www.w3.org/ns/dcat#issued */
  issued: string[];

  /* @lc-property http://purl.org/dc/terms/rights */
  rights: string[];

  /* @lc-property http://www.w3.org/ns/adms#status */
  status: string[];

  /* @lc-property http://purl.org/dc/terms/modified */
  modified: string[];

}

export interface TermsOfUse {

  /* @lc-property @id */
  iri: string;

  /* @lc-property https://data.gov.cz/slovník/podmínky-užití/osobní-údaje */
  personalData: string[];

  /* @lc-property https://data.gov.cz/slovník/podmínky-užití/autor */
  author: string[];

  /* @lc-property https://data.gov.cz/slovník/podmínky-užití/autorské-dílo */
  authorship: string[];

  /* @lc-property https://data.gov.cz/slovník/podmínky-užití/autor-databáze */
  databaseAuthor: string[];

  /* @lc-property https://data.gov.cz/slovník/podmínky-užití/databáze-jako-autorské-dílo */
  databaseAuthorship: string[];

  /* @lc-property https://data.gov.cz/slovník/podmínky-užití/atabáze-chráněná-zvláštními-právy */
  protectedDatabase: string[];

}

export interface FacilitatedSharing {

  /* @lc-property @id */
  iri: string;

  /* @lc-property https://slovník.gov.cz/legislativní/sbírka/360/2023/pojem/je-sdílen-jako */
  sharedAs: string[];

  /* @lc-property https://slovník.gov.cz/legislativní/sbírka/360/2023/pojem/je-sdílen-způsobem */
  sharedBy: string[];

  /* @lc-property https://slovník.gov.cz/legislativní/sbírka/360/2023/pojem/je-získán-způsobem */
  obtainedBy: string[];

  /* @lc-property https://slovník.gov.cz/legislativní/sbírka/360/2023/pojem/odpovídající-pojem */
  correspondingTerm: string[];

}

export interface DataService {

  /* @lc-property @id */
  iri: string;

  /* @lc-property @type */
  type: string[];

  /* @lc-property http://xmlns.com/foaf/0.1/page */
  documentation: string[];

  /* @lc-property http://purl.org/dc/terms/title */
  title: LanguageString | null;

  /* @lc-property http://www.w3.org/ns/dcat#endpointDescription */
  endpointDescription: string[];

  /* @lc-property http://data.europa.eu/r5r/applicableLegislation */
  applicableLegislation: string[];

  /* @lc-property http://www.w3.org/ns/dcat#endpointURL */
  endpointUrl: string[];

  /* @lc-property http://purl.org/dc/terms/conformsTo */
  conformsTo: string[];

  /* @lc-property http://www.w3.org/ns/adms#identifier */
  otherIdentifier: Identifier[];

  /* @lc-property http://www.w3.org/ns/dcat#contactPoint */
  contactPoint: Agent[];

}

function jsonLdToAgent(reader: SubjectReader): Agent {
  return {
    iri: reader.identifier().value,
    title: reader.languageString(VCARD.fn),
    email: reader.values(VCARD.hasEmail).map(email => {
      if (email.startsWith("mailto:")) {
        return email.substring("mailto:".length);;
      } else {
        return email;
      }
    })
  }
}

function jsonLdToDistribution(reader: SubjectReader): Distribution {
  return {
    iri: reader.identifier().value,
    type: reader.types(),
    title: reader.languageString(DCTERMS.title),
    description: reader.languageString(DCTERMS.description),
    accessUrl: reader.values(DCAT.accessURL),
    format: reader.values(DCTERMS.format),
    license: reader.values(DCTERMS.license),
    byteSize: reader.values(DCAT.byteSize),
    checksum: reader.values(SPDX.checksum),
    documentation: reader.values(FOAF.page),
    downloadURL: reader.values(DCAT.downloadURL),
    language: reader.values(DCTERMS.language),
    conformsTo: reader.values(DCTERMS.conformsTo),
    mediaType: reader.values(DCAT.mediaType),
    issued: reader.values(DCTERMS.issued),
    rights: reader.values(DCTERMS.rights),
    status: reader.values(ADMS.status),
    modified: reader.values(DCTERMS.modified),
    packageFormat: reader.values(DCAT.packageFormat),
    compressFormat: reader.values(DCAT.compressFormat),
    termsOfUse: reader.subjects(PU.specification).map(jsonLdToTermsOfUse),
    applicableLegislation: reader.values(EUROPE.applicableLegislation),
    //
    dataService: reader.subjects(DCAT.accessService).map(jsonLdToDataService),
    facilitatesSharing: reader.subjects(LEGISLATION.facilitatesSharing)
      .map(jsonLdToFacilitatedSharing),
    sharedInterfaceAccessType:
      reader.values(LEGISLATION.sharedInterfaceAccessType),
    sharedInterfaceContentType:
      reader.values(LEGISLATION.sharedInterfaceContentType),
    sharedInterfaceKind: reader.values(LEGISLATION.sharedInterfaceKind),
  }
}

function jsonLdToTheme(reader: SubjectReader): Theme {
  return {
    iri: reader.identifier().value,
    inScheme: reader.values(SKOS.inScheme),
  }
}

function jsonLdToTemporal(reader: SubjectReader): Temporal {
  return {
    iri: reader.identifier().value,
    startDate: reader.date(DCAT.startDate),
    endDate: reader.date(DCAT.endDate),
  }
}

function jsonLdToIdentifier(reader: SubjectReader): Identifier {
  return {
    iri: reader.identifier().value,
    type: reader.types(),
    notation: reader.values(SKOS.notation),
    creator: reader.values(DCTERMS.creator),
  }
}

function jsonLdToTermsOfUse(reader: SubjectReader): TermsOfUse {
  return {
    iri: reader.identifier().value,
    personalData: reader.values(PU.personalData),
    author: reader.values(PU.author),
    authorship: reader.values(PU.authorship),
    databaseAuthor: reader.values(PU.databaseAuthor),
    databaseAuthorship: reader.values(PU.databaseAuthorship),
    protectedDatabase: reader.values(PU.protectedDatabase),
  }
}

function jsonLdToFacilitatedSharing(reader: SubjectReader): FacilitatedSharing {
  return {
    iri: reader.identifier().value,
    obtainedBy: reader.values(LEGISLATION.obtainedBy),
    sharedAs: reader.values(LEGISLATION.sharedAs),
    sharedBy: reader.values(LEGISLATION.sharedBy),
    correspondingTerm: reader.values(LEGISLATION.correspondingTerm),
  }
}

function jsonLdToDataService(reader: SubjectReader): DataService {
  return {
    iri: reader.identifier().value,
    type: reader.types(),
    title: reader.languageString(DCTERMS.title),
    endpointDescription: reader.values(DCAT.endpointDescription),
    endpointUrl: reader.values(DCAT.endpointURL),
    conformsTo: reader.values(DCTERMS.conformsTo),
    applicableLegislation: reader.values(EUROPE.applicableLegislation),
    otherIdentifier: reader.subjects(ADMS.identifier).map(jsonLdToIdentifier),
    documentation: reader.values(FOAF.page),
    contactPoint: reader.subjects(DCAT.contactPoint).map(jsonLdToAgent),
  }
}

export function jsonLdToCatalog(reader: SubjectReader): Catalog {
  return {
    iri: reader.identifier().value,
    type: reader.types(),
  }
}

export interface Catalog {

  /* @lc-property @id */
  iri: string;

  /* @lc-property @type */
  type: string[];

}

export function jsonLdToCatalogRecord(reader: SubjectReader): CatalogRecord {
  return {
    iri: reader.identifier().value,
    type: reader.types(),
    primaryTopic: reader.values(FOAF.primaryTopic),
    language: reader.values(DCTERMS.language),
    conformsTo: reader.values(DCTERMS.conformsTo),
  };
}

export interface CatalogRecord {

  /* @lc-property @id */
  iri: string;

  /* @lc-property @type */
  type: string[];

  /* @lc-property http://xmlns.com/foaf/0.1/primaryTopic */
  primaryTopic: string[];

  /* @lc-property http://purl.org/dc/terms/language */
  language: string[];

  /* @lc-property http://purl.org/dc/terms/conformsTo */
  conformsTo: string[];
}

export function jsonLdToPublicAdministrationInformationSystem(
  reader: SubjectReader,
): PublicAdministrationInformationSystem {
  return {
    iri: reader.identifier().value,
    type: reader.types(),
    includes: reader.values(LEGISLATION.includes),
  };
}

export interface PublicAdministrationInformationSystem {

  /* @lc-property @id */
  iri: string;

  /* @lc-property @type */
  type: string[];

  /* @lc-property https://slovník.gov.cz/legislativní/sbírka/365/2000/pojem/zahrnuje */
  includes: string[];

}
