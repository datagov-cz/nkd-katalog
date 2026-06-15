import assert from "node:assert";
import { describe, it } from "node:test"

import { createTranslationService } from "./translation-service.ts";

describe("Translation service.", () => {

  const data = {
    "count": [
      [0, "Zero"],
      [1, "One"],
      [2, "Value {}"],
    ],
    "query": "dotaz",
  };

  const service = createTranslationService(data);

  it("Simple translation", () => {
    assert.strictEqual(service.translate("query"), "dotaz");
  });

  it("Translation with a number", () => {
    assert.strictEqual(service.translate("count", -1), "Zero");

    assert.strictEqual(service.translate("count", 0), "Zero");

    assert.strictEqual(service.translate("count", 1), "One");

    assert.strictEqual(service.translate("count", 2), "Value 2");

    assert.strictEqual(service.translate("count", 5), "Value 5");
  });

});
