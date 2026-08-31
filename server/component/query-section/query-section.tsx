import { Language } from "../../localization/index.ts";

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

/** Fixed chrome around the chips; per language, previously inlined per-template. */
const CHROME: { [language: string]: QuerySectionChrome } = {
  "cs": {
    temporalCoverage: "Časové pokrytí",
    from: "od",
    to: "do",
    cancelTemporalCoverage: "Zrušit časové pokrytí",
    removeFilterFor: "Zrušit filter pro",
  },
  "en": {
    temporalCoverage: "Temporal coverage",
    from: "from",
    to: "to",
    cancelTemporalCoverage: "Cancel temporal coverage",
    removeFilterFor: "Remove filter for",
  },
};

interface QuerySectionChrome {
  temporalCoverage: string;
  from: string;
  to: string;
  cancelTemporalCoverage: string;
  removeFilterFor: string;
}

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

// -- View -----------------------------------------------------------------

export function QuerySection({
  state,
  language,
}: {
  state: QuerySectionViewModel;
  language: Language;
}) {
  const chrome = CHROME[language];
  return (
    <>
      <gov-grid-item size-sm="12/12">
        <div class="p-2">
          {state.showTemporal ? (
            <div class="flex-row pt-1">
              <div class="pr-2">{chrome.temporalCoverage} :</div>
              <div class="flex-row gap-2">
                {state.temporalStart ? (
                  <TemporalChip
                    prefix={chrome.from}
                    cancel={chrome.cancelTemporalCoverage + " " + chrome.from}
                    action={state.temporalStart}
                  />
                ) : null}
                {state.temporalEnd ? (
                  <TemporalChip
                    prefix={chrome.to}
                    cancel={chrome.cancelTemporalCoverage + " " + chrome.to}
                    action={state.temporalEnd}
                  />
                ) : null}
              </div>
            </div>
          ) : null}
          {state.items.map((group) => (
            <div class="flex-row pt-1">
              <div class="pr-2">{group.label} :</div>
              <div class="flex-row gap-2">
                {group.items.map((action) => (
                  <gov-chip variant="secondary" type="outlined" size="xs">
                    <span>{action.label}</span>
                    <gov-button
                      slot="right"
                      variant="secondary"
                      type="outlined"
                      wcag-label={chrome.removeFilterFor + " " + action.label}
                      size="xs"
                      href={action.href}
                    >
                      <gov-icon slot="right-icon" name="x-lg"></gov-icon>
                    </gov-button>
                  </gov-chip>
                ))}
              </div>
            </div>
          ))}
        </div>
      </gov-grid-item>
      <hr />
    </>
  );
}

function TemporalChip({
  prefix,
  cancel,
  action,
}: {
  prefix: string;
  cancel: string;
  action: Action;
}) {
  return (
    <gov-chip variant="secondary" type="outlined" size="xs">
      <span>
        {prefix} {action.label}
      </span>
      <gov-button
        slot="right"
        variant="secondary"
        type="outlined"
        wcag-label={cancel + " " + action.label}
        size="xs"
        href={action.href}
      >
        <gov-icon slot="right-icon" name="x-lg"></gov-icon>
      </gov-button>
    </gov-chip>
  );
}
