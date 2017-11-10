/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * See LICENSE file in root directory for full license.
 */
"use strict"

const debug = require("debug")("eslint-cli")
const resolve = require("resolve")

/**
 * Finds and tries executing a local eslint module.
 *
 * @param {string} basedir - A path of the directory that it starts searching.
 * @returns {object|null} The local eslint module.
 */
module.exports = (basedir) => {
    try {
        const binPath = resolve.sync("eslint", { basedir })
        debug("FOUND '%s'", binPath)
        return require(binPath)
    }
    catch (err) {
        if ((err && err.code) !== "MODULE_NOT_FOUND") {
            throw err
        }
        debug("NOT_FOUND 'eslint'")
        return null
    }
}
