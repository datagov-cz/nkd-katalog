import type { Node, Term, Statement } from "./rdf-model.ts";

export interface RdfReader<InputType> {
  /**
   * @throws
   */
  parse(input: InputType, collector: RdfCollector): Promise<void>;
}

export interface RdfCollector {
  consume(subject: Node | null, predicate: string, object: Term | null): void;
}

/**
 * Collect RDF statements into an array.
 */
export function collectToArray(): CollectToArray {
  const statements: Statement[] = [];
  return {
    consume(subject, predicate, object) {
      if (subject === null || object === null) {
        return;
      }
      statements.push([subject, predicate, object]);
    },
    result() {
      return statements;
    },
  };
}

interface CollectToArray extends RdfCollector {
  result(): Statement[];
}
