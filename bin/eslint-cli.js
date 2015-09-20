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

var spawn = require("child_process").spawn;
var fs = require("fs");
var path = require("path");
var chalk = require("chalk");
var debug = require("debug")("eslint-cli");
var resolve = require("resolve").sync;

var cwd = process.cwd();

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
        return fs.statSync(filePath).isFile();
    }
    catch (err) {
        return false;
    }
}

/**
 * Executes a given JavaScript file with the same arguments as this.
 *
 * @param {string} filePath - A file path to execute.
 * @returns {child_process.ChildProcess|null} A child process or null.
 */
function execute(filePath) {
    var command = process.argv[0];
    var args = process.argv.slice(1);
    args[0] = filePath;

    debug("EXECUTE", command, args);

    try {
        return spawn(command, args, {stdio: "inherit"});
    }
    catch (err) {
        debug("FAILED TO EXECUTE", err.stack);
        return null;
    }
}

/**
 * Finds and tries executing "./bin/eslint.js".
 *
 * This is useful to ESLint contributors.
 * ESLint's repository has "./bin/eslint.js".
 *
 * @returns {child_process.ChildProcess|null} A child process or null.
 */
function tryExecutingBinEslintJs() {
    var dir = cwd;
    var prevDir = dir;
    do {
        var binPath = path.join(dir, "bin", "eslint.js");
        if (exists(binPath)) {
            debug("FOUND", binPath);
            return execute(binPath);
        }
        debug("NOT FOUND", binPath);

        // Finish if package.json is found.
        if (exists(path.join(dir, "package.json"))) {
            break;
        }

        // Go to next.
        prevDir = dir;
        dir = path.resolve(dir, "..");
    }
    while (dir !== prevDir);

    debug("NOT FOUND", "\"./bin/eslint.js\"");
    return null;
}

/**
 * Finds and tries executing a local eslint module.
 *
 * @returns {child_process.ChildProcess|null} A child process or null.
 */
function tryExecutingESLint() {
    var indexPath = null;
    try {
        indexPath = resolve("eslint", {basedir: cwd});
        debug("FOUND", indexPath);
    }
    catch (err) {
        debug("NOT FOUND", "\"eslint\"");
        return null;
    }

    var binPath = path.resolve(path.dirname(indexPath), "..", "bin", "eslint.js");
    debug("FOUND", binPath);
    return execute(binPath);
}

//------------------------------------------------------------------------------
// Main
//------------------------------------------------------------------------------
/* eslint-disable no-process, no-console */

debug("START", process.argv);
debug("ROOT", cwd);

var task = tryExecutingBinEslintJs() || tryExecutingESLint();

if (task == null) {
    console.error(chalk.red.bold(
        "Cannot find local ESLint!\n" +
        "Please install ESLint by `npm install eslint --save-dev`.\n"
    ));
    process.exit(1);
}

debug("PID", task.pid);

task.on("exit", function(exitCode) {
    debug("EXIT", exitCode);
    process.exit(exitCode);
});
task.on("error", function(error) {
    debug("ERROR", error.stack);
});
