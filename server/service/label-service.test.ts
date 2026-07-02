import assert from "node:assert";
import { describe, it } from "node:test"

import { createLabelService } from "./label-service.ts";

describe("Label service", () => {

  it("Default implementation test.", async () => {
    let callCounter = 0;

    const service = createLabelService([{
      async fetchLabel() {
        ++callCounter;
        return { et: "JSON-LD", en: "JSON-LD" };
      },
    }], []);

    const first = await service.fetchLabel(["cs"], "");
    assert.strictEqual(first, null);

    const second = await service.fetchLabel(["cs"], "");
    assert.strictEqual(second, null);

    const en = await service.fetchLabel(["en"], "");
    assert.strictEqual(en, "JSON-LD");

    const fallback = await service.fetchLabel(["cs", "en"], "");
    assert.strictEqual(fallback, "JSON-LD");

    // We should have called the service only once.
    assert.strictEqual(callCounter, 1);
  });

  it("Use empty language as fallback.", async () => {

    const service = createLabelService([{
      async fetchLabel() {
        return { "": "JSON-LD" };
      },
    }], []);

    const value = await service.fetchLabel(["en"], "");
    assert.strictEqual(value, "JSON-LD");

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
    assert.strictEqual(cs, "Příklad");

    const en = await service.fetchLabel(["en"], "");
    assert.strictEqual(en, "Example");

    const json = await service.fetchLabel(["en"], ":json");
    assert.strictEqual(json, "json");

  });

});
