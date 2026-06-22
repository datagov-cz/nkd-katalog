import { LanguageString, Literal, NamedNode, Statement } from "./rdf-model.ts";

export function createStatementRdfBuilder(): RdfBuilder<Statement[]> {
  return new DefaultRdfBuilder();
}

export interface RdfBuilder<ResultType> {
  addType(subject: string, type: string): this;

  addIris(subject: string, predicate: string, iris: string[]): this;

  addIri(subject: string, predicate: string, iri: string | null): this;

  addLanguageString(
    subject: string,
    predicate: string,
    string: LanguageString | null,
  ): this;

  addLiteral(
    subject: string,
    predicate: string,
    literal: Date | string | boolean | number | null,
  ): this;

  build(): ResultType;
}

class DefaultRdfBuilder implements RdfBuilder<Statement[]> {
  readonly statement: Statement[] = [];

  addType(subject: string, type: string): this {
    this.statement.push([this.iri(subject), RDFS.type, this.iri(type)]);
    return this;
  }

  private iri(value: string): NamedNode {
    return { termType: "NamedNode", value };
  }

  addIris(subject: string, predicate: string, iris: string[]): this {
    const s = this.iri(subject);
    for (const value of iris) {
      this.statement.push([s, predicate, this.iri(value)]);
    }
    return this;
  }

  addIri(subject: string, predicate: string, iri: string | null): this {
    if (iri === null) {
      return this;
    }
    this.statement.push([this.iri(subject), predicate, this.iri(iri)]);
    return this;
  }

  addLanguageString(
    subject: string,
    predicate: string,
    string: LanguageString | null,
  ): this {
    if (string === null) {
      return this;
    }
    for (const [language, value] of Object.entries(string)) {
      this.statement.push([
        this.iri(subject),
        predicate,
        {
          termType: "Literal",
          value,
          language,
        } as Literal,
      ]);
    }
    return this;
  }

  addLiteral(
    subject: string,
    predicate: string,
    literal: string | boolean | number | null,
  ): this {
    if (literal === null) {
      return this;
    }
    if (typeof literal === "boolean") {
      this.statement.push([
        this.iri(subject),
        predicate,
        {
          termType: "Literal",
          value: String(literal),
          datatype: this.iri(XSD.boolean),
        } as Literal,
      ]);
    } else if (typeof literal === "string") {
      this.statement.push([
        this.iri(subject),
        predicate,
        {
          termType: "Literal",
          value: String(literal),
          datatype: this.iri(XSD.string),
        } as Literal,
      ]);
    } else if (Number.isInteger(literal)) {
      this.statement.push([
        this.iri(subject),
        predicate,
        {
          termType: "Literal",
          value: String(literal),
          datatype: this.iri(XSD.integer),
        } as Literal,
      ]);
    } else if (typeof (literal as any).toISOString === "function") {
      this.statement.push([
        this.iri(subject),
        predicate,
        {
          termType: "Literal",
          value: (literal as any).toISOString(),
          datatype: this.iri(XSD.date),
        } as Literal,
      ]);
    } else {
      throw new Error("Unsupported operation exception.");
    }
    return this;
  }

  build(): Statement[] {
    return this.statement;
  }
}

const RDFS_PREFIX = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";

const RDFS = {
  type: RDFS_PREFIX + "type",
};

const XSD_PREFIX = "http://www.w3.org/2001/XMLSchema#";

const XSD = {
  boolean: XSD_PREFIX + "boolean",
  integer: XSD_PREFIX + "integer",
  double: XSD_PREFIX + "double",
  string: XSD_PREFIX + "string",
  date: XSD_PREFIX + "date",
};
