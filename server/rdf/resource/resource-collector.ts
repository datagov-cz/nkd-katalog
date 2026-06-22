import type { Resource, ResourceByIri } from "./resource-model.ts";
import type { Node } from "../rdf-model.ts";
import type { RdfCollector } from "../rdf-reader.ts";

/**
 * Collect statements into {@link Resource}s.
 */
export function createResourceCollector(): ResourceCollector {
  const resourceMap: { [iri: string]: Resource } = {};
  return {
    consume(subject, predicate, object) {
      if (subject === null || object === null) {
        return;
      }
      const resource = getOrCreateResource(resourceMap, subject);
      let property = resource.properties[predicate];
      if (property === undefined) {
        property = [];
        resource.properties[predicate] = property;
      }
      property.push(object);
    },
    result(): ResourceByIri {
      return resourceMap;
    },
  };
}

function getOrCreateResource(
  resourceMap: { [iri: string]: Resource },
  subject: Node,
): Resource {
  const identifier = subject.value;
  let resource = resourceMap[identifier];
  if (resource === undefined) {
    resource = {
      identifier:
        subject.termType === "NamedNode"
          ? {
              termType: "NamedNode",
              value: identifier,
            }
          : {
              termType: "BlankNode",
              value: identifier,
            },
      properties: {},
    };
    resourceMap[identifier] = resource;
  }
  return resource;
}

export interface ResourceCollector extends RdfCollector {
  result(): ResourceByIri;
}
