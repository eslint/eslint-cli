/**
 * @author Toru Nagashima
 * @copyright 2015 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var fs = require("fs")
var path = require("path")
var debug = require("debug")("eslint-cli")

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Checks whether or not the file which is at given path exists.
 *
 * @param {string} filePath - A file path to check.
 * @returns {boolean} `true` if the file which is at given path exists.
 */
function exists(filePath) {
    try {
        return fs.statSync(filePath).isFile()
    }
    catch (_err) {
        return false
    }
}

//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

/**
 * Finds and tries executing "./bin/eslint.js".
 *
 * This is useful to ESLint contributors.
 * ESLint's repository has "./bin/eslint.js".
 *
 * @param {string} basedir - A path of the directory that it starts searching.
 * @returns {string|null} The path of "./bin/eslint.js"
 */
module.exports = function getBinEslintJs(basedir) {
    var dir = basedir
    var prevDir = dir
    do {
        var binPath = path.join(dir, "bin", "eslint.js")
        if (exists(binPath)) {
            debug("FOUND", binPath)
            return binPath
        }
        debug("NOT FOUND", binPath)

        // Finish if package.json is found.
        if (exists(path.join(dir, "package.json"))) {
            break
        }

        // Go to next.
        prevDir = dir
        dir = path.resolve(dir, "..")
    }
    while (dir !== prevDir)

    debug("NOT FOUND", "'./bin/eslint.js'")
    return null
}
