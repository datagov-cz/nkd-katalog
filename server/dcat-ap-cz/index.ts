export * from "./dcat-ap-cz-model.ts";

/**
 * Detected from a dcat:Dataset types and applicable legislation.
 */
export function createApplicableLegislation(): ApplicableLegislation {
  return {
    containsOpenData,
    isOpenData,
    containsNonPublicData,
    isNonPublicData,
    containsPublicRegistry,
    isPublicRegistry,
    containsHighValueDataset,
    isHighValueDataset,
    containsDynamicData,
    isDynamicData,
  };
}

interface ApplicableLegislation {

  containsOpenData(types: string[]): boolean;

  isOpenData(legislation: string): boolean;

  containsPublicRegistry(types: string[]): boolean;

  isPublicRegistry(legislation: string): boolean;

  containsHighValueDataset(types: string[]): boolean;

  isHighValueDataset(legislation: string): boolean;

  containsDynamicData(types: string[]): boolean;

  isDynamicData(legislation: string): boolean;

  containsNonPublicData(types: string[]): boolean;

  isNonPublicData(legislation: string): boolean;

}

function containsOpenData(types: string[]): boolean {
  return types.some(isOpenData);
}

function isOpenData(legislation: string): boolean {
  return OPEN_DATA_LEGISLATION.includes(legislation);
}

function containsNonPublicData(types: string[]): boolean {
  return types.some(isNonPublicData);
}

function isNonPublicData(legislation: string): boolean {
  return NON_PUBLIC_DATA_LEGISLATION.includes(legislation);
}

function containsPublicRegistry(types: string[]): boolean {
  return types.some(isPublicRegistry);
}

function isPublicRegistry(legislation: string): boolean {
  return PUBLIC_REGISTRY.includes(legislation);
}

function containsHighValueDataset(types: string[]): boolean {
  return types.some(isHighValueDataset);
}

function isHighValueDataset(legislation: string): boolean {
  return HIGH_VALUE_DATASET.includes(legislation);
}

function containsDynamicData(types: string[]): boolean {
  return types.some(isDynamicData);
}

function isDynamicData(legislation: string): boolean {
  return DYNAMIC_DATA.includes(legislation);
}

const OPEN_DATA_LEGISLATION: string[] = [
  "http://data.europa.eu/eli/dir/2019/1024/oj",
  "https://www.e-sbirka.cz/eli/cz/sb/1999/106/2025-08-19",
];

const NON_PUBLIC_DATA_LEGISLATION: string[] = [
  "http://data.europa.eu/eli/reg/2022/868/oj",
  "https://www.e-sbirka.cz/eli/cz/sb/2026/60/2026-05-27",
  "https://www.e-sbirka.cz/eli/cz/sb/2000/365/2026-01-01",
  "https://www.e-sbirka.cz/eli/cz/sb/2023/360/2024-07-01",
];

const PUBLIC_REGISTRY = [
  "https://www.e-sbirka.cz/eli/cz/sb/1999/106/2025-08-19/dokument/norma/cast_1/par_5a/odst_1",
  "https://www.e-sbirka.cz/eli/cz/sb/1999/106/2024-01-01/dokument/norma/cast_1/par_5a/odst_1",
];

const HIGH_VALUE_DATASET = [
  "http://data.europa.eu/eli/reg_impl/2023/138/oj",
  "https://www.e-sbirka.cz/eli/cz/sb/1999/106/2025-08-19/dokument/norma/cast_1/par_5b",
];

const DYNAMIC_DATA = [
  "https://www.e-sbirka.cz/eli/cz/sb/1999/106/2024-01-01/dokument/norma/cast_1/par_3a/odst_6",
  "https://www.e-sbirka.cz/eli/cz/sb/1999/106/2025-08-19/dokument/norma/cast_1/par_3a/odst_6",
];
