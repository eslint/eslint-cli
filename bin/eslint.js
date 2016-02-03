#!/usr/bin/env node

/**
 * @author Toru Nagashima
 * @copyright 2015 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var path = require("path");
var debug = require("debug")("eslint-cli");
var resolve = require("resolve").sync;

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
    var indexPath = null;
    try {
        indexPath = resolve("eslint", {basedir: basedir});
    }
    catch (err) {
        debug("NOT FOUND", "\"eslint\"");
        return null;
    }

    var binPath = path.resolve(path.dirname(indexPath), "..", "bin", "eslint.js");
    debug("FOUND", binPath);
    return binPath;
}

//------------------------------------------------------------------------------
// Main
//------------------------------------------------------------------------------
/* eslint-disable no-process, no-console */

var cwd = process.cwd();

debug("START", process.argv);
debug("ROOT", cwd);

var binPath = getLocalEslint(cwd) || require("../lib/get-bin-eslint-js")(cwd);
if (binPath != null) {
    require(binPath);
}
else {
    console.error(require("chalk").red.bold(
        "Cannot find local ESLint!\n" +
        "Please install ESLint by `npm install eslint --save-dev`.\n"
    ));
    process.exit(1);
}
