import N3 from "n3";

import { Node, Term } from "../rdf-model.ts";
import { StringRdfWriter } from "../rdf-writer.ts";

const dataFactory = N3.DataFactory;

export function createStringN3RdfWriter(options?: {
  prefixes?: { [prefix: string]: string };
  pretty?: boolean;
}): StringRdfWriter {
  const writer = new N3.Writer({
    format: "text-turtle",
    prefixes: options?.prefixes ?? {},
  });
  // Create and return an instance.
  return {
    addStatements(statements) {
      for (const [s, p, o] of statements) {
        writer.addQuad(
          convertSubject(s),
          convertPredicate(p),
          convertObject(o),
        );
      }
    },
    asString() {
      return new Promise((accept, reject) => {
        writer.end((error, result) => {
          if (error) {
            reject(error);
            return;
          }
          if (options?.pretty) {
            accept(prettyPrintTurtle(result));
            return;
          }
          accept(result);
        });
      });
    },
  };
}

function convertSubject(value: Node): N3.Quad_Subject {
  switch (value.termType) {
    case "NamedNode":
      return dataFactory.namedNode(value.value);
    case "BlankNode":
      return dataFactory.blankNode(value.value);
  }
}

function convertPredicate(value: string): N3.Quad_Predicate {
  return dataFactory.namedNode(value);
}

function convertObject(value: Term): N3.Quad_Object {
  switch (value.termType) {
    case "NamedNode":
      return dataFactory.namedNode(value.value);
    case "BlankNode":
      return dataFactory.blankNode(value.value);
    case "Literal":
      return dataFactory.literal(
        value.value,
        value.language === null
          ? dataFactory.namedNode(value.termType)
          : value.language,
      );
  }
}

/**
 * Add an empty line before each resource section.
 */
function prettyPrintTurtle(turtle: string): string {
  const lines = turtle.split(/\r?\n|\r|\n/g);
  const linesNext = [];
  for (const line of lines) {
    linesNext.push(line);
    if (line.startsWith("@prefix")) {
      continue;
    }
    if (line.endsWith(".")) {
      linesNext.push("");
    }
  }
  return linesNext.join("\n");
}
