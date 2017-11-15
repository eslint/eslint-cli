/**
 * @author Ian VanSchooten
 * @author Toru Nagashima <https://github.com/mysticatea>
 * See LICENSE file in root directory for full license.
 */
"use strict"

const debug = require("debug")("eslint-cli")
const get = require("lodash/get")
const MAX_COMPLEXITY = 255

/**
 * Resolve $ref properties.
 * @param {object} schema The current schema.
 * @param {object} root The root object of the current schema.
 * @returns {object} The schema.
 */
function resolveRef(schema, root) {
    if (schema == null || typeof schema !== "object") {
        return schema
    }
    root = root || schema //eslint-disable-line no-param-reassign

    if (Array.isArray(schema)) {
        for (const element of schema) {
            resolveRef(element, root)
        }
    }
    else {
        for (const key of Object.keys(schema)) {
            resolveRef(schema[key], root)
        }
    }

    // $ref があれば解決する
    if (typeof schema.$ref === "string") {
        const refObj = get(root, schema.$ref.slice(2).split("/"))
        if (refObj) {
            for (const key of Object.keys(refObj)) {
                if (schema[key] === undefined) {
                    schema[key] = refObj[key]
                }
            }
        }
        else {
            debug("INSPECT $ref '%s' was not found.", schema.$ref)
        }
        delete schema.$ref
    }

    return schema
}

/**
 * Normalize a given schema object as an array.
 * @param {object|Array} schema A schema object to normalize.
 * @returns {object} The normalized schema.
 */
function normalizeSchema(schema) {
    if (schema && !Array.isArray(schema)) {
        return resolveRef(schema)
    }
    return resolveRef({
        type: "array",
        items: schema || [],
    })
}

/**
 * Iterate patterns of a given schema object.
 * @param {Array} items The 'schema.items'.
 * @param {number} index The current index.
 * @param {Array} basePattern The patterns of the previous index.
 * @returns {IterableIterator<Array>} The patterns.
 */
function* iteratePatternsOfArray(items, index, basePattern) {
    const isLast = (index === items.length - 1)

    for (const elementPattern of iteratePatterns(items[index])) {
        if (elementPattern === undefined) {
            yield undefined
            break
        }

        basePattern[index] = elementPattern
        if (isLast) {
            yield basePattern.slice(0)
        }
        else {
            yield* iteratePatternsOfArray(items, index + 1, basePattern)
        }
    }
}

/**
 * Iterate patterns of a given schema object.
 * @param {object} properties The 'schema.properties'.
 * @param {Array} propertyNames The 'Object.keys(schema.properties)'.
 * @param {number} index The current index.
 * @param {object} basePattern The patterns of the previous index.
 * @returns {IterableIterator<Array>} The patterns.
 */
function* iteratePatternsOfObject(properties, propertyNames, index, basePattern) {
    const isLast = (index === propertyNames.length - 1)
    const propertyName = propertyNames[index]

    for (const elementPattern of iteratePatterns(properties[propertyName])) {
        if (elementPattern === undefined) {
            delete basePattern[propertyName]
        }
        else {
            basePattern[propertyName] = elementPattern
        }

        if (isLast) {
            yield Object.assign({}, basePattern)
        }
        else {
            yield* iteratePatternsOfObject(properties, propertyNames, index + 1, basePattern)
        }
    }
}

/**
 * Iterate patterns of a given schema object.
 * @param {object} schema A schema object to iterate patterns.
 * @returns {IterableIterator<Array>} The patterns.
 */
function* iteratePatterns(schema) { //eslint-disable-line complexity
    if (schema.allOf) {
        debug("INSPECT not-supported type: 'allOf'")
        yield undefined
        return
    }
    if (schema.anyOf || schema.oneOf) {
        for (const element of schema.anyOf || schema.oneOf) {
            yield* iteratePatterns(element)
        }
        return
    }
    if (schema.enum) {
        yield* schema.enum
        return
    }

    switch (schema.type) {
        case "boolean":
            yield true
            yield false
            break

        case "number":
        case "string":
            debug("INSPECT non-supported type: '%s'", schema.type)
            yield undefined
            break

        case "array":
            if (Array.isArray(schema.items)) {
                if (schema.items.length >= 1) {
                    yield* iteratePatternsOfArray(schema.items, 0, [])
                }
            }
            else {
                debug("INSPECT non-supported type: 'array' with 'schema.items' is not an array.")
                yield undefined
            }
            break

        case "object":
            if (schema.additionalProperties) {
                debug("INSPECT non-supported type: 'object' with 'schema.additionalProperties'.")
                yield undefined
            }
            else {
                const propertyNames = Object.keys(schema.properties || {})
                if (propertyNames.length >= 1) {
                    yield* iteratePatternsOfObject(schema.properties, Object.keys(schema.properties), 0, {})
                }
            }
            break

        default:
            debug("INSPECT unknown type: '%s'", schema.type)
            yield undefined
    }
}

/**
 * Load rules and create the map of option patterns.
 * @param {eslint.Linter} linter The linter object to load rules.
 * @returns {Array<{ruleId:string,pattern:object}>} The array of option patterns.
 */
module.exports = (linter) => {
    const result = []

    for (const entry of linter.getRules()) {
        const ruleId = entry[0]
        const meta = entry[1].meta
        if (meta.deprecated || meta.docs.recommended) {
            continue
        }

        const schema = normalizeSchema(meta.schema)
        const patterns = [{ [ruleId]: "error" }]

        for (const pattern of iteratePatterns(schema)) {
            if (pattern === undefined) {
                debug("INSPECT check '%s' rule only without options because it has non-supported pattern.", ruleId)
                patterns.length = 1
                break
            }

            pattern.unshift("error")
            patterns.push({ [ruleId]: pattern })

            if (patterns.length > MAX_COMPLEXITY) {
                debug("INSPECT check '%s' rule only without options because it has too many option patterns.", ruleId)
                patterns.length = 1
                break
            }
        }

        for (const pattern of patterns) {
            result.push({ ruleId, pattern })
        }
    }

    return result
}
