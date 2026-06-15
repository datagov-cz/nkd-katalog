import assert from "node:assert";
import { describe, it } from "node:test"

import { createNavigationService } from "./navigation-service.ts";

describe("Navigation service", () => {

  const service = createNavigationService();

  service.view("cs", "list")
    .setNavigationData({
      "path": "seznam",
      "query": { "title": "název", "sort": "pořadí" },
      "argument": { "title": "název" },
    })
    .setBeforeLink((_, query) => query);

  service.view("cs", "detail")
    .setNavigationData({
      "path": "detail",
      "query": { "detail": "detail" },
      "argument": {},
    });

  service.view("cs", "multiple")
    .setNavigationData({
      "path": "multiple",
      "query": { "keyword": ["klíčová-slova", "klíčová slova"] },
      "argument": {},
    });

  it("Path", () => {
    assert.strictEqual(
      service.view("cs", "list").linkFromServer({}),
      "seznam");
    assert.strictEqual(
      service.view("cs", "detail").linkFromServer({}),
      "detail");
  });

  it("Query", () => {

    assert.strictEqual(
      service.view("cs", "list").queryArgumentFromClient(
        { "název": "value" }, "title"),
      "value");

    assert.strictEqual(
      service.view("cs", "list").queryArgumentFromClient(
        {}, "missing"),
      null);

    assert.deepEqual(
      service.view("cs", "list").queryArgumentArrayFromClient(
        { "název": ["first", "second"] }, "title"),
      ["first", "second"]);

    assert.deepEqual(
      service.view("cs", "list").queryArgumentArrayFromClient(
        { "název": "first" }, "title"),
      ["first"]);
  });

  it("Argument", () => {
    assert.strictEqual(
      service.view("cs", "list").argumentFromServer("title"),
      "název");;
  });

  it("Link from server", () => {
    assert.strictEqual(
      service.view("cs", "list").linkFromServer({ "sort": "title" }),
      "seznam?po%C5%99ad%C3%AD=title");
  });

  it("First of multiple query", () => {
    // Any of given can be used to parse the value.
    assert.strictEqual(
      service.view("cs", "multiple").queryArgumentFromClient(
        { "klíčová-slova": "value" }, "keyword"),
      "value");
  });

  it("Second of multiple query", () => {
    // Any of given can be used to parse the value.
    assert.strictEqual(
      service.view("cs", "multiple").queryArgumentFromClient(
        { "klíčová slova": "value" }, "keyword"),
      "value");
  });

  it("Second of multiple query as array", () => {
    assert.deepEqual(
      service.view("cs", "multiple").queryArgumentArrayFromClient(
        { "klíčová-slova": "value" }, "keyword"),
      ["value"]);
  });

  it("Link from server with multiple", () => {
    assert.strictEqual(
      service.view("cs", "multiple").linkFromServer({ "keyword": "title" }),
      "multiple?kl%C3%AD%C4%8Dov%C3%A1-slova=title");
  });

});
