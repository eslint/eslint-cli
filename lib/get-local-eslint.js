/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2017 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

const debug = require("debug")("eslint-cli")
const resolve = require("resolve")

/**
 * Finds and tries executing a local eslint module.
 *
 * @param {string} basedir - A path of the directory that it starts searching.
 * @returns {string|null} The path of a local eslint module.
 */
module.exports = (basedir) => {
    try {
        const binPath = resolve.sync("eslint/bin/eslint.js", { basedir })
        debug("FOUND '%s'", binPath)
        return binPath
    }
    catch (err) {
        if ((err && err.code) !== "MODULE_NOT_FOUND") {
            throw err
        }
        debug("NOT FOUND 'eslint/bin/eslint.js'")
        return null
    }
}
