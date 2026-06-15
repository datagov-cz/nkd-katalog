import Handlebars from "handlebars";

type HandlebarsType = typeof Handlebars;

export function createHandlebars(): HandlebarsType {
  const handlebars = Handlebars.create();
  registerHelpers(handlebars);
  return handlebars;
}

function registerHelpers(handlebars: HandlebarsType): void {
  // {{#if (notEmpty cards)}} ... {{/if}}
  handlebars.registerHelper("notEmpty", function (value) {
    return value !== undefined && value.length > 0;
  });

  // Replace line endings with <br>.
  handlebars.registerHelper("breaklines", (value) => {
    const escapedText = Handlebars.Utils.escapeExpression(value);
    const result = escapedText.replace(/(\r\n|\n|\r)/gm, "<br>");
    return new Handlebars.SafeString(result);
  });
}
