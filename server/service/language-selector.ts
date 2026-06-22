import { Language } from "../localization/index.ts";
import { LanguageString } from "../rdf/index.ts";

export function createLanguageSelector(languages: Language[]) {
  return (value: LanguageString | null | undefined): string | null => {
    if (value === null || value === undefined) {
      return null;
    }
    // Based on preferences.
    for (const language of languages) {
      if (value[language] === undefined) {
        continue;
      }
      return value[language];
    }
    // Any other.
    return Object.values(value)[0] ?? null;
  };
}
