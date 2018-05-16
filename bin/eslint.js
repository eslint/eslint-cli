#!/usr/bin/env node
/**
 * @author Toru Nagashima
 * See LICENSE file in root directory for full license.
 */
"use strict"

const path = require("path")
const spawnSync = require("child_process").spawnSync

const debug = require("debug")("eslint-cli")
const debugMode = process.argv.indexOf("--debug") !== -1
const useGlobalFallback = true;
const cwd = process.cwd()

if (debugMode) {
    require("debug").enable("eslint-cli")
}

debug("START", process.argv)
debug("ROOT", cwd)

const binPath = require("../lib/get-local-eslint")(cwd) || require("../lib/get-bin-eslint-js")(cwd)

if (binPath != null) {
    require(binPath)
}
else if (useGlobalFallback) {
    try {
        const yarnGlobalDir = spawnSync("yarn", ["global", "dir"])
        if (yarnGlobalDir.stdout) {
            require(path.resolve(
                yarnGlobalDir.stdout.toString().trim(),
                "node_modules", "eslint", "bin", "eslint.js"))
        }
    }
    catch (err) {
        if ((err && err.code) !== "MODULE_NOT_FOUND") {
            throw err
        }
        // eslint-disable-next-line no-console
        console.error(`
Could not find local and global ESLint.
Please install ESLint by 'npm install --save-dev eslint'.
`)
    }
}
else {
    //eslint-disable-next-line no-console
    console.error(`
Could not find local ESLint.
Please install ESLint by 'npm install --save-dev eslint'.
`)
    process.exitCode = 1
}
