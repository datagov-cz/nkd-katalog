// We use '@types/jsonld' which does not really reflect types,
// but it is better then nothing.
import jsonld from "jsonld";

import type { Node, Term, NamedNode } from "../rdf-model.ts";
import type { RdfCollector, RdfReader } from "../rdf-reader.ts";

export function createJsonLdReader(): RdfReader<object | []> {
  return new JsonLdReader();
}

class JsonLdReader implements RdfReader<object | []> {
  async parse(input: object | [], collector: RdfCollector): Promise<void> {
    const options = { documentLoader };
    const rdf = (await jsonld.toRDF(input, options)) as RdfQuad[];
    for (const { subject, predicate, object } of rdf) {
      collector.consume(subject, predicate.value, object);
    }
  }
}

const documentLoader = async (url: string) => {
  if (documentCache[url] === undefined) {
    const loader = (jsonld as any).documentLoaders.node();
    // Encode the URL to allow for national characters.
    documentCache[url] = await loader(encodeURI(url));
  }
  return documentCache[url];
};

const documentCache: { [url: string]: any } = {};

/**
 * Custom type definition as '@types/jsonld' is not really working.
 */
interface RdfQuad {
  subject: Node;

  predicate: NamedNode;

  object: Term;

  graph: Node;
}
