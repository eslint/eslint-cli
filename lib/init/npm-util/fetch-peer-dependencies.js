/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * See LICENSE file in root directory for full license.
 */
"use strict"

const debug = require("debug")("eslint-cli")
const spawnNpm = require("./spawn-npm")

// Map<string, Promise<object>>
const cache = new Map()

/**
 * Fetch `peerDependencies` of a given package with `npm show` command.
 * @param {object} context The context info.
 * @param {string} context.cwd The path to the current working directory.
 * @param {string|null} context.packageJsonPath The path to `package.json` file if exists.
 * @param {function} context.log The function to display log messages.
 * @param {string} packageName The package name to fetch peerDependencies.
 * @returns {Promise<object>} Gotten peerDependencies.
 */
module.exports = (context, packageName) => {
    let promise = cache.get(packageName)
    if (promise != null) {
        debug("CACHE_HIT npm show --json %s peerDependencies", packageName)
    }
    else {
        context.log("Checking peer dependencies of '%s'.", packageName)
        promise = spawnNpm(
            ["show", "--json", packageName, "peerDependencies"],
            { cwd: context.cwd, encoding: "utf8" }
        ).then(jsonText => JSON.parse(jsonText.trim() || "{}"))

        cache.set(packageName, promise)
    }

    promise.then(result => {
        debug("PEER_DEPS '%s' → %j", packageName, result)
    })

    return promise
}
