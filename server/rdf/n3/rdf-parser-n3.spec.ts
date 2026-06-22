import { describe, test, expect } from "vitest";
import { createStringN3RdfReader } from "./rdf-parser-n3.ts";
import { collectToArray } from "../rdf-reader.ts";

describe("createStringN3RdfReader", () => {
  /**
   * Parse simple turtle file fragment.
   */
  test("Implementation test I.", async () => {
    const input = `
@prefix dct: <http://purl.org/dc/terms/> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix prof: <http://www.w3.org/ns/dx/prof/> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

<https://w3id.org/dsv#> a owl:Ontology, prof:Profile;
    dct:title "Data Specification Vocabulary"@en ;
    dct:description "Data Specification Vocabulary (DSV) ..."@en ;
    dct:issued "2024-10-01"^^xsd:date ;
    dct:created "2024-10-01"^^xsd:date ;
    dct:modified "2025-05-14"^^xsd:date ;
    owl:versionIRI <https://w3id.org/dsv/1.0.0#> ;
    owl:versionInfo "1.0.0" ;
    rdfs:comment "See also DSV D";
.`;

    //

    const collector = collectToArray();
    const reader = createStringN3RdfReader();
    await reader.parse(input, collector);
    const actual = collector.result();

    // We just check the number of statements.

    expect(actual.length).toBe(10);
  });
});
