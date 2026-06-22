// RDF basic primitives
export * from "./rdf-model.ts";

// RDF parsers
export { type RdfCollector as Collector, collectToArray } from "./rdf-reader.ts";
export { createJsonLdReader } from "./jsonld/rdf-parser-jsonld.ts";
export {
  createStringN3RdfReader,
  createStreamN3RdfReader,
} from "./n3/rdf-parser-n3.ts";

// RDF Writers
export { createStringN3RdfWriter } from "./n3/rdf-writer-n3.ts";

// RDF readers
export { type Resource, type ResourceByIri } from "./resource/resource-model.ts";
export {
  type ResourceReader,
  type SubjectReader,
  createResourceReader,
} from "./resource/resource-reader.ts";
export { createResourceCollector } from "./resource/resource-collector.ts";

// RDF builder
export { type RdfBuilder, createStatementRdfBuilder } from "./rdf-builder.ts";

// Utilities
export { parseJsonLdToJsonReader as parseJsonLd } from "./utilities.ts";
