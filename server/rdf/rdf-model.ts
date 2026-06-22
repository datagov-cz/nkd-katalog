export type Node = NamedNode | BlankNode;

export type Term = Node | Literal;

export interface NamedNode {
  termType: "NamedNode";

  value: string;
}

export function isNamedNode(term: Term): term is NamedNode {
  return term.termType === "NamedNode";
}

export interface BlankNode {
  termType: "BlankNode";

  value: string;
}

export interface Literal {
  termType: "Literal";

  /**
   * Text value of the literal.
   */
  value: string;

  /**
   * Optional information about a language.
   */
  language: string | null;

  datatype: NamedNode;
}

export function isLiteral(term: Term): term is Literal {
  return term.termType === "Literal";
}

/**
 * Statement in subject, predicate, object format.
 */
export type Statement = [Node, string, Term];

export type LanguageString = { [language: string]: string };
