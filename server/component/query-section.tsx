import { Language } from "../localization/index.ts";

const SECTION_LABELS: { [language: string]: Record<string, string> } = {
  "cs": {
    "publishers": "Poskytovatelé",
    "datasetTypes": "Druh datové sady",
    "themes": "Témata",
    "hvdCategories": "Kategorie HVD",
    "dataServiceTypes": "Datová služba",
    "formats": "Formáty",
    "keywords": "Klíčová slova",
    "isvs": "Informační systém veřejné správy",
  },
  "en": {
    "publishers": "Publishers",
    "datasetTypes": "Dataset kind",
    "themes": "Themes",
    "hvdCategories": "HVD category",
    "dataServiceTypes": "Data service",
    "formats": "Formats",
    "keywords": "Keywords",
    "isvs": "Public administration information system",
  },
};

export function createQuerySectionData(
  state: QuerySectionState,
  language: Language,
): QuerySectionViewModel {
  const labels = SECTION_LABELS[language];
  const items: { label: string; items: Action[] }[] = [];
  const push = (key: string, actions: Action[]): void => {
    if (actions.length > 0) {
      items.push({ label: labels[key], items: actions });
    }
  };

  push("publishers", state.publishers);
  push("datasetTypes", state.datasetTypes);
  push("themes", state.themes);
  push("hvdCategories", state.hvdCategories);
  push("dataServiceTypes", state.dataServiceTypes);
  push("formats", state.formats);
  push("keywords", state.keywords);
  push("isvs", state.isvs);

  return {
    showTemporal: state.temporalStart !== null || state.temporalEnd !== null,
    temporalStart: state.temporalStart,
    temporalEnd: state.temporalEnd,
    items,
  };
}

export interface QuerySectionState {
  temporalStart: Action | null;
  temporalEnd: Action | null;
  publishers: Action[];
  datasetTypes: Action[];
  themes: Action[];
  hvdCategories: Action[];
  dataServiceTypes: Action[];
  formats: Action[];
  keywords: Action[];
  isvs: Action[];
}

export interface Action {
  /** Label to display. */
  label: string;
  /** URL to navigate to, to cancel the filter. */
  href: string;
}

export interface QuerySectionViewModel {
  showTemporal: boolean;
  temporalStart: Action | null;
  temporalEnd: Action | null;
  items: { label: string; items: Action[] }[];
}
