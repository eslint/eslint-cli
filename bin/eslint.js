#!/usr/bin/env node
/**
 * @author Toru Nagashima
 * @copyright 2015 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var debug = require("debug")("eslint-cli")
var resolve = require("resolve").sync

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Finds and tries executing a local eslint module.
 *
 * @param {string} basedir - A path of the directory that it starts searching.
 * @returns {string|null} The path of a local eslint module.
 */
function getLocalEslint(basedir) {
    try {
        var binPath = resolve("eslint/bin/eslint.js", {basedir: basedir})
        debug("FOUND", binPath)
        return binPath
    }
    catch (_err) {
        debug("NOT FOUND", "'eslint'")
        return null
    }
}

//------------------------------------------------------------------------------
// Main
//------------------------------------------------------------------------------

var cwd = process.cwd()

debug("START", process.argv)
debug("ROOT", cwd)

var binPath = getLocalEslint(cwd) || require("../lib/get-bin-eslint-js")(cwd)
if (binPath != null) {
    require(binPath)
}
else {
    //eslint-disable-next-line no-console
    console.error(require("chalk").red.bold(
        "Cannot find local ESLint!\n" +
        "Please install ESLint by `npm install eslint --save-dev`.\n"
    ))
    process.exitCode = 1
}
