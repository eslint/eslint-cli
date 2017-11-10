/**
 * @author Toru Nagashima
 * See LICENSE file in root directory for full license.
 */
"use strict"

const fs = require("fs")
const path = require("path")
const debug = require("debug")("eslint-cli")

/**
 * Finds and tries executing "./bin/eslint.js".
 *
 * This is useful to ESLint contributors.
 * ESLint's repository has "./bin/eslint.js".
 *
 * @param {string} basedir - A path of the directory that it starts searching.
 * @returns {string|null} The path of "./bin/eslint.js"
 */
module.exports = (basedir) => {
    let dir = basedir
    let prevDir = dir
    do {
        const binPath = path.join(dir, "bin", "eslint.js")
        if (fs.existsSync(binPath)) {
            debug("FOUND '%s'", binPath)
            return binPath
        }
        debug("NOT_FOUND '%s'", binPath)

        // Finish if package.json is found.
        if (fs.existsSync(path.join(dir, "package.json"))) {
            break
        }

        // Go to next.
        prevDir = dir
        dir = path.resolve(dir, "..")
    }
    while (dir !== prevDir)

    debug("NOT_FOUND './bin/eslint.js'")
    return null
}
