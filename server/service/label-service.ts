import logger from "../logger.ts";

export function createLabelService(
  sources: Source[], cacheSources: CacheSource[],
): LabelService {
  return new DefaultLabelService(sources, cacheSources);
}

interface Source {

  /**
   * Fetch labels for given IRI in given languages.
   * @returns Null if there was an error.
   */
  fetchLabel: (
    languages: string[], iri: string,
  ) => Promise<LanguageString | null>;

}

type LanguageString = { [language: string]: string };

interface CacheSource {

  /**
   * Fetch initial label data in given languages.
   */
  fetchInitialCache: (languages: string[]) => Promise<{
    iri: string;
    labels: { value: string, language: string }[];
  }[]>;
}

export interface LabelService {

  /**
   * Return label for given IRI based on given language preferences.
   */
  fetchLabel: (languages: Language[], iri: string) => Promise<string | null>;

  /**
   * Add labels to given resources based on given language preferences.
   */
  addLabelToResources: <Type extends { iri: string }> (
    languages: Language[],
    resources: (Type | null | undefined)[],
    defaultValue?: (resource: Type) => string | null,
  ) => Promise<void>;

  /**
   * @throws False when reload failed.
   */
  reloadCache: (languages: Language[]) => Promise<boolean>;

}

type Language = "en" | "cs";

class DefaultLabelService implements LabelService {

  readonly sources: Source[];

  readonly cacheSources: CacheSource[];

  readonly cache = new MemoryCache();

  constructor(sources: Source[], cacheSources: CacheSource[]) {
    this.sources = sources;
    this.cacheSources = cacheSources;
  }

  async fetchLabel(languages: Language[], iri: string) {
    let label = this.cache.get(iri);
    if (label === undefined) {
      label = await this.fetchLabelFromSources(languages, iri);
      this.cache.add(iri, label);
    }
    return this.selectFromLanguageString(languages, label);
  }

  private async fetchLabelFromSources(
    languages: string[], iri: string,
  ): Promise<LanguageString> {
    let result: LanguageString = {};
    for (const labelSource of this.sources) {
      const response = await labelSource.fetchLabel(languages, iri);
      if (response === null) {
        continue;
      }
      result = { ...result, ...response };
    }
    return result;
  }

  /**
   * @returns Available label for most preferred language.
   */
  private selectFromLanguageString(
    languages: Language[], value: LanguageString,
  ): string | null {
    for (const language of languages) {
      const candidate = value[language];
      if (candidate === undefined) {
        continue;
      }
      return candidate;
    }
    // Try empty string.
    return value[""] ?? null;
  }

  async addLabelToResources<Type extends { iri: string; }>(
    languages: Language[], resources: (Type | null | undefined)[],
    defaultValue?: (resource: Type) => string | null,
  ) {
    // We use IRI as a default.
    const fallback = defaultValue ?? ((resource: Type) => resource.iri);
    await Promise.all(resources
      .filter(item => item !== undefined && item !== null)
      .map(async item => {
        const label = await this.fetchLabel(languages, item.iri);
        (item as any).label = label ?? fallback(item);
      })
    )
  }

  async reloadCache(languages: string[]) {
    const nextCache = new MemoryCache();
    try {
      // Load data from all sources.
      for (const source of this.cacheSources) {
        const items = await source.fetchInitialCache(languages);
        for (const { iri, labels } of items) {
          const label: LanguageString = {};
          labels
            .filter(({ language }) =>
              // We enable empty languages to be cached as well.
              languages.includes(language) || language === "")
            .forEach(({ value, language }) => label[language] = value);
          nextCache.add(iri, label);
        }
      }
      logger.info("Replacing old cache of size %d with new of size %d.",
        this.cache.size(), nextCache.size());
      this.cache.swap(nextCache);
      return true;
    } catch (exception) {
      logger.error(exception, "Can't load label cache.");
      return false;
    }
  }

}

/**
 * TODO Cap cache size.
 */
class MemoryCache {

  private cache: Map<string, LanguageString>;

  constructor() {
    this.cache = new Map();
  }

  get(iri: string): LanguageString | undefined {
    return this.cache.get(iri);
  }

  /**
   * Add new values to the cache.
   */
  add(iri: string, value: LanguageString): void {
    const previous = this.cache.get(iri) ?? {};
    this.cache.set(iri, { ...previous, ...value });
  }

  /**
   * @returns Cache size.
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Swap inner cache structures of a memory caches.
   */
  swap(other: MemoryCache): void {
    const swap = this.cache;
    this.cache = other.cache;
    other.cache = swap;
  }

}
