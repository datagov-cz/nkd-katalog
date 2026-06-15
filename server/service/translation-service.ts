
/**
 * Create translation service from pairs or server local strings.
 */
export function createTranslationService(
  serverToLocal: Translations,
): TranslationService {
  return new DefaultTranslationService(serverToLocal);
}

export type Translations = Record<string, string | Function | (string | number)[][]>;

export interface TranslationService {
  translate: (serverMessage: string, args?: any) => string;
}

class DefaultTranslationService implements TranslationService {
  readonly serverToLocal: Translations;

  constructor(serverToLocal: Translations) {
    this.serverToLocal = serverToLocal;
  }

  translate(serverMessage: string, args: any) {
    let result;
    const entry = this.serverToLocal[serverMessage];
    // When given a function we do not care about anything else.
    if (entry instanceof Function) {
      return entry(args);
    }
    // We allow for simple "{}" substitution.
    if (Array.isArray(entry)) {
      // Initial value.
      result = entry[0][1];
      for (const [separator, localizedMessage] of entry) {
        if (separator > args) {
          break;
        }
        result = localizedMessage;
      }
    } else {
      result = entry;
      if (result === undefined) {
        console.error("Missing localization entry.", { serverMessage });
        result = "";
      }
    }
    return result.replace("{}", args);
  }
}
