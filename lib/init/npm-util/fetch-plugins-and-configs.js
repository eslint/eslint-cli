/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * See LICENSE file in root directory for full license.
 */
"use strict"

const debug = require("debug")("eslint-cli")
const fetchPeerDependencies = require("./fetch-peer-dependencies")

/**
 * Fetch the dependency names of a given config object.
 * @param {object} context The context info.
 * @param {string} context.cwd The path to the current working directory.
 * @param {string|null} context.packageJsonPath The path to `package.json` file if exists.
 * @param {function} context.log The function to display log messages.
 * @param {object} config A config object to get.
 * @param {boolean} installESLint The flag to install eslint package.
 * @returns {Promise<string[]>} The dependency names.
 */
module.exports = (context, config, installESLint) => {
    const depMap = Object.create(null)
    const promises = []

    if (config.plugins != null) {
        for (const pluginName of config.plugins) {
            depMap[`eslint-plugin-${pluginName}`] = "latest"
            promises.push(
                fetchPeerDependencies(context, `eslint-plugin-${pluginName}@latest`)
                    .then(result => Object.assign(depMap, result))
            )
        }
    }
    if (config.extends != null) {
        const configNames = Array.isArray(config.extends) ? config.extends : [config.extends]
        for (const configName of configNames) {
            if (configName.startsWith("eslint:") || configName.startsWith("plugin:")) {
                continue
            }

            depMap[`eslint-config-${configName}`] = "latest"
            promises.push(
                fetchPeerDependencies(context, `eslint-config-${configName}@latest`)
                    .then(result => Object.assign(depMap, result))
            )
        }
    }

    return Promise.all(promises).then(() => {
        if (installESLint && depMap.eslint == null) {
            depMap.eslint = "latest"
        }
        if (!installESLint && depMap.eslint != null) {
            delete depMap.eslint
        }

        debug("DEPS %j", depMap)
        return Object.keys(depMap).map(name => `${name}@${depMap[name]}`)
    })
}
