
/**
 * Create translation service from pairs or server local strings.
 */
export function createTranslationService(
  serverToLocal: Translations,
): TranslationService {
  return new DefaultTranslationService(serverToLocal);
}

export type Translations = Record<string, string | Function | (string | number)[][]>;

/**
 * Raw string entries of a route dictionary, for `{{translation.<key>}}` in
 * templates. Reading a key that is absent (or not a plain string) throws, so
 * cs/en drift surfaces at render time instead of rendering an empty string.
 */
export type TranslationDictionary = Record<string, string>;

export interface TranslationService {
  translate: (serverMessage: string, args?: any) => string;
  readonly dictionary: TranslationDictionary;
}

const PASS_THROUGH = new Set<PropertyKey>([
  "then",
  "constructor",
  "toJSON",
  Symbol.toStringTag,
  Symbol.iterator,
]);

class DefaultTranslationService implements TranslationService {
  readonly serverToLocal: Translations;

  readonly dictionary: TranslationDictionary;

  constructor(serverToLocal: Translations) {
    this.serverToLocal = serverToLocal;
    this.dictionary = new Proxy(serverToLocal as TranslationDictionary, {
      get(target, key) {
        if (typeof key !== "string" || PASS_THROUGH.has(key) || key in Object.prototype) {
          return (target as Record<PropertyKey, unknown>)[key] as string;
        }
        const value = target[key];
        if (typeof value !== "string") {
          throw new Error(`Missing or non-string translation key: "${key}"`);
        }
        return value;
      },
    });
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
