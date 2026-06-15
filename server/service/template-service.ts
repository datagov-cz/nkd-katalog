import fileSystem from "node:fs";

import Handlebars from "handlebars";

import { createHandlebars } from "../handlebars/handlebars.ts";
import configuration from "../configuration.ts";

export function createTemplateService(basePath: string): TemplateService {
  if (configuration.server.reloadTemplates) {
    return new ReloadingTemplateService(basePath);
  }
  return new BoundTemplateService(basePath);
}

interface TemplateService {

  view: (name: string) => Function | undefined;

  /**
   * Add a new component to the template service.
   */
  syncAddComponent: (name: string, path: string) => void;

  /**
   * Add a new view to the template service.
   */
  syncAddView: (name: string, path: string) => void;

}

class BoundTemplateService implements TemplateService {

  readonly views: { [name: string]: Handlebars.TemplateDelegate } = {};

  readonly basePath: string;

  readonly handlebars = createHandlebars();

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  view(name: string) {
    return this.views[name];
  }

  /**
   * Load and add partial template under given name.
   */
  syncAddComponent(name: string, path: string) {
    const content = fileSystem.readFileSync(
      this.basePath + "/component/" + path, "utf8");
    // Add partial to the handlebars.
    this.handlebars.partials[name] = this.handlebars.compile(content);
  }

  /**
   * Load and return template.
   */
  syncAddView(name: string, path: string) {
    const content = fileSystem.readFileSync(
      this.basePath + "/http/" + path, "utf8");
    // Store compiled view.
    this.views[name] = this.handlebars.compile(content);
  }

}

/**
 * Reload content with every request.
 * Use this only for debugging!
 */
class ReloadingTemplateService implements TemplateService {

  readonly views: { [name: string]: string } = {};

  /**
   * For partial with given name stores the path.
   */
  readonly partials: { [name: string]: string } = {};

  readonly basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  view(name: string) {
    const handlebars = createHandlebars();
    for (const [name, path] of Object.entries(this.partials)) {
      const content = fileSystem.readFileSync(path, "utf8");
      handlebars.partials[name] = handlebars.compile(content);
    }
    const content = fileSystem.readFileSync(this.views[name], "utf8");
    return handlebars.compile(content);
  }

  syncAddComponent(name: string, path: string) {
    this.partials[name] = this.basePath + "/component/" + path;
  }

  syncAddView(name: string, path: string) {
    this.views[name] = this.basePath + "/http/" + path;
  }

}
