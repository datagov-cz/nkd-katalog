
export function createLinkService(template: string): LinkService {
  if (template === "") {
    return {
      wrapLink: (url) => url,
    }
  }
  return {
    wrapLink: (url) => substituteToTemplate(template, url),
  };
}

export interface LinkService {

  wrapLink(url: string): string;

}

function substituteToTemplate(template: string, url: string): string {
  return template.replace("{}", encodeURIComponent(url));
}
