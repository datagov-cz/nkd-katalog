import { Resource, ResourceByIri } from "./resource-model.ts";
import { Node } from "../rdf-model.ts";

export function createResourceReader(record: ResourceByIri): ResourceReader {
  return new DefaultResourceReader(record);
}

export interface ResourceReader {

  all(): SubjectReader[];

  firstOfType(type: string): SubjectReader | null;

  allOfType(type: string): SubjectReader[];

  withIri(iri: string): SubjectReader | null;

}

export interface SubjectReader {
  identifier(): Node;

  types(): string[];

  value(predicate: string): string | null;

  values(predicate: string): string[];

  date(predicate: string): Date | null;

  numbers(predicate: string): number[];

  /**
   * @returns Values of all literals merged into a single language string.
   */
  languageString(predicate: string): LanguageString | null;

  /**
   * @returns Each language string is represented by separate result.
   */
  languageStrings(predicate: string): LanguageString[];

  /**
   * @returns Readers for each subjects.
   */
  subjects(predicate: string): SubjectReader[];

}

type LanguageString = { [language: string]: string };

const RDFS = {
  type: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
};

class DefaultResourceReader implements ResourceReader {
  readonly resources: ResourceByIri;

  constructor(record: ResourceByIri) {
    this.resources = record;
  }

  all(): SubjectReader[] {
    return Object.values(this.resources)
      .map(resource => new DefaultSubjectReader(this, resource));
  }

  firstOfType(type: string) {
    for (const resource of Object.values(this.resources)) {
      const types = resource.properties[RDFS.type] ?? [];
      if (types.find((item) => item.value === type) !== undefined) {
        return new DefaultSubjectReader(this, resource);
      }
    }
    return null;
  }

  allOfType(type: string): SubjectReader[] {
    const result: SubjectReader[] = [];
    for (const resource of Object.values(this.resources)) {
      const types = resource.properties[RDFS.type] ?? [];
      if (types.find((item) => item.value === type) !== undefined) {
        result.push(new DefaultSubjectReader(this, resource));
      }
    }
    return result;
  }

  withIri(iri: string): SubjectReader | null {
    for (const resource of Object.values(this.resources)) {
      if (resource.identifier.value === iri) {
        return new DefaultSubjectReader(this, resource);
      }
    }
    return null;
  }

}

class DefaultSubjectReader implements SubjectReader {

  readonly reader: ResourceReader;

  readonly resource: Resource;

  constructor(reader: ResourceReader, resource: Resource) {
    this.reader = reader;
    this.resource = resource;
  }

  identifier(): Node {
    return this.resource.identifier;
  }

  types(): string[] {
    const values = this.resource.properties[RDFS.type] ?? [];
    return values.map(value => value.value);
  }

  value(predicate: string) {
    const values = this.resource.properties[predicate];
    return values?.[0].value ?? null;
  }

  values(predicate: string): string[] {
    const values = this.resource.properties[predicate] ?? [];
    return values.map(value => value.value);
  }

  date(predicate: string): Date | null {
    const value = this.value(predicate);
    if (value === null) {
      return null;
    }
    return new Date(value);
  }

  numbers(predicate: string): number[] {
    const values = this.resource.properties[predicate] ?? [];
    const result: number[] = [];
    for (const value of values) {
      if (value.termType !== "Literal") {
        continue;
      }
      result.push(Number(value.value));
    }
    return result;
  }

  languageString(predicate: string): LanguageString | null {
    const values = this.resource.properties[predicate];
    if (values === undefined) {
      return null;
    }
    const result: LanguageString = {};
    for (const value of values) {
      if (value.termType !== "Literal") {
        continue;
      }
      result[value.language ?? ""] = value.value;
    }
    if (Object.keys(result).length === 0) {
      return null;
    }
    return result;
  }

  languageStrings(predicate: string): LanguageString[] {
    const values = this.resource.properties[predicate] ?? [];
    const result: LanguageString[] = [];
    for (const value of values) {
      if (value.termType !== "Literal") {
        continue;
      }
      result.push({ [value.language ?? ""]: value.value });
    }
    return result;
  }

  subjects(predicate: string): SubjectReader[] {
    const values = this.resource.properties[predicate] ?? [];
    const result: SubjectReader[] = [];
    for (const value of values) {
      if (value.termType === "Literal") {
        continue;
      }
      const reader = this.reader.withIri(value.value);
      if (reader === null) {
        // There is no information about given resource, we return a fake.
        const stub: Resource = {
          identifier: value,
          properties: {},
        };
        result.push(new DefaultSubjectReader(this.reader, stub));
      } else {
        result.push(reader);
      }
    }
    return result;
  }

}
