export * from "./dcat-ap-cz-model.ts";

/**
 * Detected from a dcat:Dataset types.
 */
export function containsOpenData(types: string[]): boolean {
  return types.includes(OPEN_DATA);
}

const OPEN_DATA = "https://data.dia.gov.cz/zdroj/číselníky/typ-datové-sady/položky/otevřená-data";

/**
 * Detected from a dcat:Dataset types.
 */
export function containsNonPublicData(types: string[]): boolean {
  return types.includes(NON_PUBLIC_DATA);
}

const NON_PUBLIC_DATA = "https://data.dia.gov.cz/zdroj/číselníky/typ-datové-sady/položky/neveřejná-data";

export function containsDynamicData(legislation: string[]): boolean {
  return legislation.find(isDynamicData) !== undefined;
}

export function isDynamicData(legislation: string) : boolean {
  return DYNAMIC_DATA.includes(legislation);
}

const DYNAMIC_DATA = [
  "https://www.e-sbirka.cz/eli/cz/sb/1999/106/2024-01-01/dokument/norma/cast_1/par_3a/odst_6",
  "https://www.e-sbirka.cz/eli/cz/sb/1999/106/2025-08-19/dokument/norma/cast_1/par_3a/odst_6",
];

export function containsHighValueDataset(legislation: string[]): boolean {
  return legislation.find(isHighValueDataset) !== undefined;
}

export function isHighValueDataset(legislation: string): boolean {
  return HIGH_VALUE_DATASET.includes(legislation);
}

const HIGH_VALUE_DATASET = [
  "http://data.europa.eu/eli/reg_impl/2023/138/oj",
  "https://www.e-sbirka.cz/eli/cz/sb/1999/106/2025-08-19/dokument/norma/cast_1/par_5b",
];

export function containsPublicRegistry(legislation: string[]): boolean {
  return legislation.find(isPublicRegistry) !== undefined;
}

export function isPublicRegistry(legislation: string): boolean {
  return PUBLIC_REGISTRY.includes(legislation);
}

const PUBLIC_REGISTRY = [
  "https://www.e-sbirka.cz/eli/cz/sb/1999/106/2025-08-19/dokument/norma/cast_1/par_5a/odst_1",
  "https://www.e-sbirka.cz/eli/cz/sb/1999/106/2024-01-01/dokument/norma/cast_1/par_5a/odst_1",
];
