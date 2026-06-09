import { describe, it, expect } from "vitest";
import { createLabelService } from "./label-service.ts";

describe("createLabelService", () => {

  it("Default implementation test.", async () => {
    let callCounter = 0;

    const service = createLabelService([{
      async fetchLabel() {
        ++callCounter;
        return { et: "JSON-LD", en: "JSON-LD" };
      },
    }], []);

    const first = await service.fetchLabel(["cs"], "");
    expect(first).toBeNullable();

    const second = await service.fetchLabel(["cs"], "");
    expect(second).toBeNullable();

    const en = await service.fetchLabel(["en"], "");
    expect(en).toBe("JSON-LD");

    const fallback = await service.fetchLabel(["cs", "en"], "");
    expect(fallback).toBe("JSON-LD");

    // We should have called the service only once.
    expect(callCounter).toBe(1);
  });

  it("Use empty language as fallback.", async () => {

    const service = createLabelService([{
      async fetchLabel() {
        return { "": "JSON-LD" };
      },
    }], []);

    const value = await service.fetchLabel(["en"], "");
    expect(value).toBe("JSON-LD");

  });

  it("Reload cache.", async () => {

    const service = createLabelService([], [{
      async fetchInitialCache() {
        return [{
          iri: "",
          labels: [
            { language: "cs", value: "Příklad" },
            { language: "en", value: "" }
          ]
        }, {
          iri: ":json",
          labels: [{ language: "", value: "json" }]
        }]
      },
    }, {
      async fetchInitialCache() {
        return [{
          iri: "",
          labels: [
            { language: "en", value: "Example" }
          ]
        }]
      },
    }]);

    await service.reloadCache(["cs", "en"]);

    const cs = await service.fetchLabel(["cs"], "");
    expect(cs).toBe("Příklad");

    const en = await service.fetchLabel(["en"], "");
    expect(en).toBe("Example");

    const json = await service.fetchLabel(["en"], ":json");
    expect(json).toBe("json");

  });

});
