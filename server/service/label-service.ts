import logger from "../logger";

export function createLabelService(
  sources: Source[], cacheSources: CacheSource[],
): LabelService {
  return new DefaultLabelService(sources, cacheSources);
}

interface Source {

  /**
   * Fetch labels for given IRI in given languages.
   */
  fetchLabel: (languages: string[], iri: string) => Promise<LanguageString>;

}

type LanguageString = { language: string };

interface CacheSource {

  /**
   * Fetch initial label data in given languages.
   */
  fetchInitialCache: (languages: string[]) => Promise<{
    iri: string;
    labels: { value: string, language: string }[];
  }[]>;
}

interface LabelService {

  /**
   * Return label for given IRI.
   */
  fetchLabel: (
    languages: string[],
    iri: string,
  ) => Promise<String | undefined>;

  /**
   * Add labels to given resources.
   */
  addLabelToResources: <Type extends { iri: string }> (
    languages: string[],
    resources: (Type | null | undefined)[],
    defaultValue?: (resource: Type) => string | null,
  ) => Promise<void>;

  // TODO Update addLabelToResources to addLabelToResourcesNext
  // addLabelToResourcesNext: <Type extends { iri: string }> (
  //   languages: string[],
  //   resources: (Type | null | undefined)[],
  //   defaultValue?: (resource: Type) => string | null,
  // ) => Promise<(Type | { label: string })[]>;

  /**
   * @throws False when reload failed.
   */
  reloadCache: (languages: string[]) => Promise<boolean>;

}

class DefaultLabelService implements LabelService {

  readonly sources: Source[];

  readonly cacheSources: CacheSource[];

  readonly cache = new MemoryCache();

  constructor(sources: Source[], cacheSources: CacheSource[]) {
    this.sources = sources;
    this.cacheSources = cacheSources;
  }

  async fetchLabel(languages: string[], iri: string) {
    const cached = this.retrieveFromCache(languages, iri);
    if (cached !== undefined) {
      return cached;
    }
    // Fetch all data.
    let labels: { [language: string]: string } = {};
    for (const labelSource of this.sources) {
      const response = await labelSource.fetchLabel(languages, iri);
      if (response === null) {
        continue;
      }
      labels = { ...labels, ...response };
    }
    // Update cache and find our result.
    let result = null;
    for (const language of languages) {
      const cached = this.cache.get(language, iri);
      const label = labels[language] ?? null;
      if (cached === undefined) {
        this.cache.set(language, iri, label);
      }
      result = result ?? cached ?? label;
    }
    // Result can be null when there is no value in any of required languages.
    // This is also the case for strings without a language.
    if (result === null) {
      result = labels[""] ?? null;
      if (result !== null) {
        this.cache.set(languages[0], iri, result);
      }
    }
    return result;
  }

  private retrieveFromCache(
    languages: string[], iri: string,
  ): string | undefined {
    for (const language of languages) {
      const cached = this.cache.get(language, iri);
      if (cached === undefined) {
        continue;
      }
      return cached;
    }
    return undefined;
  }

  async addLabelToResources<Type extends { iri: string; }>(
    languages: string[], resources: (Type | null | undefined)[],
    defaultValue?: (resource: Type) => string | null,
  ) {
    const fallback = defaultValue ?? ((resource: Type) => resource.iri);
    await Promise.all(resources
      .filter(item => item !== undefined && item !== null)
      .map(async item => {
        const label =
          await this.fetchLabel(languages, item.iri) ?? fallback(item);
        (item as any).label = label;
      })
    )
  }

  async reloadCache(languages: string[]) {
    const nextCache = new MemoryCache();
    try {
      // Load data from all sources.
      for (const source of this.cacheSources) {
        const items = await source.fetchInitialCache(languages);
        // Save
        for (const item of items) {
          for (const label of item.labels) {
            nextCache.set(label.language, item.iri, label.value);
          }
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

  private cache: Map<string, string>;

  constructor() {
    this.cache = new Map();
  }

  get(language: string, iri: string): string | undefined {
    const key = this.key(language, iri);
    return this.cache.get(key);
  }

  private key(language: string, iri: string): string {
    return language + ":" + iri;
  }

  set(language: string, iri: string, value: string): void {
    const key = this.key(language, iri);
    this.cache.set(key, value);
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
