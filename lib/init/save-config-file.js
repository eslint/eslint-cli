/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * See LICENSE file in root directory for full license.
 */
"use strict"

const fs = require("fs")
const path = require("path")
const debug = require("debug")("eslint-cli")
const stringify = require("json-stable-stringify")
const getLocalESLint = require("./get-local-eslint")

// Convert a given config object to the string which represents the config.
const createContentAs = {
    ".js"(config, filePath) {
        const code = `module.exports = ${stringify(config, { space: 4 })};`
        const basedir = path.dirname(filePath)
        const eslint = getLocalESLint(basedir)

        if (eslint == null) {
            return code
        }

        try {
            // Fix the code with the given config.
            const linter = new eslint.CLIEngine({
                baseConfig: config,
                fix: true,
                useEslintrc: false,
            })
            const report = linter.executeOnText(code)

            return report.results[0].output || code
        }
        catch (_err) {
            // Ignore since this error is trivial.
            return code
        }
    },

    ".yml"(config) {
        // lazy load YAML to improve performance when not used
        return require("js-yaml").safeDump(config, { sortKeys: true })
    },

    ".json"(config) {
        return stringify(config, { space: 4 })
    },
}

/**
 * Save a given config object.
 * @param {string} filePath The path to the destination file.
 * @param {object} config The config object to save.
 * @returns {Promise<void>} -
 */
module.exports = (filePath, config) =>
    new Promise((resolve, reject) => {
        debug("SAVE '%s'", filePath)

        const type = path.extname(filePath)
        const content = createContentAs[type](config, filePath)

        fs.writeFile(filePath, content, (error) => {
            if (error != null) {
                reject(error)
            }
            else {
                resolve()
            }
        })
    })
