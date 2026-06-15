
/**
 * @param {object} entity
 * @returns Resource identifier.
 */
export function getId(entity) {
  return entity["@id"];
}

/**
 * @param {object} entity
 * @return {string[]} Array of types or an empty array.
 */
export function getTypes(entity) {
  const types = entity["@type"];
  if (types === undefined) {
    return []
  } else if (Array.isArray(types)) {
    return types;
  } else {
    return [types];
  }
}

/**
 * @param {object} entity
 * @param {string} type
 * @return {boolean} True when given entity is of given type.
 */
export function hasType(entity, type) {
  return getTypes(entity).includes(type);
}

/**
 * @param {object} entity
 * @param {string} predicate
 * @returns {{[language: string]: string} | null} Object with language pairs.
 */
export function getString(entity, predicate) {
  const strings = getStrings(entity, predicate);
  if (strings.length === 0) {
    return null;
  }
  /** @type {{ [language: string]: string }} */
  let result = {}
  strings.forEach((string) => {
    result = { ...result, ...string };
  });
  return result;
}

export function getStrings(entity, predicate) {
  return asArray(entity[predicate]).map(valueToString);
}

function asArray(value) {
  if (value === undefined || value === null) {
    return [];
  } else if (Array.isArray(value)) {
    return value;
  } else {
    return [value];
  }
}

function valueToString(value) {
  if (value["@value"] === undefined) {
    // This is a primitive value.
    return { "": value };
  }
  if (value["@language"]) {
    // There is language.
    return { [value["@language"]]: value["@value"] };
  }
  // There is no language.
  return { "": value["@value"] };
}

/**
 * @param {object} entity
 * @param {string} predicate
 * @returns {string | null}
 */
export function getResource(entity, predicate) {
  const resources = getResources(entity, predicate);
  return resources[0] ?? null;
}

/**
 * @param {object} entity
 * @param {string} predicate
 * @returns {string[]}
 */
export function getResources(entity, predicate) {
  return asArray(entity[predicate]).map(item => item["@id"]);
}

/**
 * @param {object} entity
 * @param {string} predicate
 * @returns {string | null}
 */
export function getValue(entity, predicate) {
  const values = getValues(entity, predicate);
  return values[0] ?? null;
}

/**
 * @param {object} entity
 * @param {string} predicate
 * @returns {string[]}
 */
export function getValues(entity, predicate) {
  return asArray(entity[predicate]).map(asPlainValue);
}

function asPlainValue(value) {
  if (value["@value"] === undefined) {
    return value;
  } else {
    return value["@value"];
  }
}

/**
 * @param {object[]} jsonld Array of JSON-LD objects with "@id".
 * @param {string} iri
 * @returns Resource with given identifier or null.
 */
export function getEntityByIri(jsonld, iri) {
  if (iri === undefined || iri === null) {
    return null;
  }
  for (const entity of jsonld) {
    if (getId(entity) === iri) {
      return entity;
    }
  }
  return null;
}

/**
 * @param {object} entity
 * @param {string} predicate
 * @returns {string | null}
 */
export function getPlainString(entity, predicate) {
  return getPlainStrings(entity, predicate)[0] ?? null;
}

/**
 * @param {object} entity
 * @param {string} predicate
 * @returns {string[]}
 */
export function getPlainStrings(entity, predicate) {
  return asArray(entity[predicate]).map(asPlainValue);
}

/**
 * @param {object[]} jsonld
 * @param {string} type
 * @returns First found entity with given type or null.
 */
export function getEntityByType(jsonld, type) {
  for (const entity of jsonld) {
    if (hasType(entity, type)) {
      return entity;
    }
  }
  return null;
}

/**
 * @param {object[]} jsonld
 * @param {string} type
 * @returns {object[]}
 */
export function getEntitiesByType(jsonld, type) {
  const result = [];
  for (const entity of jsonld) {
    if (hasType(entity, type)) {
      result.push(entity);
    }
  }
  return result;
}
