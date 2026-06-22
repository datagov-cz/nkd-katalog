import { createJsonLdReader } from "./jsonld/rdf-parser-jsonld.ts";
import { createStringN3RdfReader } from "./n3/rdf-parser-n3.ts";
import { createResourceCollector } from "./resource/resource-collector.ts";
import { createResourceReader, ResourceReader } from "./resource/resource-reader.ts";

export async function parseJsonLdToJsonReader(
  document: object | [],
): Promise<ResourceReader> {
  const collector = createResourceCollector();
  await createJsonLdReader().parse(document, collector);
  return createResourceReader(collector.result());
}

export async function parseTurtleToJsonReader(
  document: string,
): Promise<ResourceReader> {
  const collector = createResourceCollector();
  await createStringN3RdfReader().parse(document, collector);
  return createResourceReader(collector.result());
}
