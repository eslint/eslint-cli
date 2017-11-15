/**
 * @author Ian VanSchooten
 * @author Ilya Volodin
 * @author Toru Nagashima <https://github.com/mysticatea>
 * See LICENSE file in root directory for full license.
 */
"use strict"

const fs = require("fs")
const path = require("path")
const debug = require("debug")("eslint-cli")
const PQueue = require("p-queue")
const Progress = require("progress")
const resolvePath = require("resolve").sync
const getOptionPatterns = require("./get-option-patterns")

/**
 * Read a file.
 * @param {string} filePath A path to a target file.
 * @returns {Promise<string>} The content of the file.
 */
function readFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, "utf8", (error, code) => {
            if (error) {
                reject(error)
            }
            else {
                resolve(code)
            }
        })
    })
}

/**
 * Inspection context.
 * This has the local `eslint` instance to inspect source codes.
 *
 * TODO: The inspection logic requires some private files of ESLint.
 */
class InspectionContext {
    /**
     * Initialize this InspectionContext.
     * @param {object} initContext The context.
     * @param {string} initContext.cwd The path to the current working directory.
     * @param {string|null} initContext.packageJsonPath The path to `package.json` file if exists.
     * @param {function} initContext.log The function to display log messages.
     */
    constructor(initContext) {
        const opts = { basedir: initContext.cwd }
        const eslintPath = resolvePath("eslint", opts)
        const globUtilPath = path.join(path.dirname(eslintPath), "util/glob-util")

        this.cwd = initContext.cwd
        this.log = initContext.log
        this.eslint = require(eslintPath)
        this.globUtil = require(globUtilPath)
        this.linter = new this.eslint.Linter()
        this.optionPatterns = getOptionPatterns(this.linter)

        Object.freeze(this)
    }

    /**
     * Get the list of file paths of given glob patterns.
     * @param {string[]} patterns Glob patterns to lookup.
     * @returns {string[]} The file paths.
     */
    listFiles(patterns) {
        const opts = { cwd: this.cwd }
        const patterns2 = this.globUtil.resolveFileGlobPatterns(patterns, opts)

        return this.globUtil.listFilesToProcess(patterns2, opts)
            .filter(fileInfo => !fileInfo.ignored)
            .map(fileInfo => fileInfo.filename)
    }

    /**
     * Normalize a given config.
     * @param {object} baseConfig The base config to inspect.
     * @returns {object} The normalized config object.
     */
    normalizeConfig(baseConfig) {
        return new this.eslint.CLIEngine({ baseConfig, useEslintrc: false })
            .getConfigForFile("a.js")
    }

    /**
     * Inspect a file.
     * @param {object} baseConfig The base config to inspect.
     * @param {string} filePath The path to the target file.
     * @param {Set<{ruleId:string,pattern:object}>} optionPatternCandidates The option patterns. This set is mutated.
     * @returns {Promise<void>} -
     */
    inspectFile(baseConfig, filePath, optionPatternCandidates) {
        return readFile(filePath).then(sourceCodeText => {
            const config = Object.assign({}, baseConfig)
            let sourceCode = null

            // Check all candidates on this file.
            for (const candidate of optionPatternCandidates) {
                try {
                    config.rules = candidate.pattern
                    const messages = this.linter.verify(sourceCode || sourceCodeText, config, filePath)
                    const count = messages.reduce(
                        (c, m) => (m.ruleId === candidate.ruleId ? c + 1 : c),
                        0
                    )

                    // Skip this file if syntax errors exist.
                    if (messages.length >= 1 && messages[0].fatal) {
                        debug("INSPECT skip this file because it has syntax error: '%s'.", filePath)
                        break
                    }

                    // Reuse the source code object to improve performance.
                    if (!sourceCode) {
                        sourceCode = this.linter.getSourceCode()
                    }

                    // Delete the entry from the candidate set if errors exist.
                    if (count >= 1) {
                        debug("INSPECT %j reports %d errors on '%s'.", candidate.pattern, count, filePath)
                        optionPatternCandidates.delete(candidate)
                    }
                }
                catch (error) {
                    debug("INSPECT ERROR with %j %s", { filePath, candidate }, error.stack)
                }
            }
        })
    }

    /**
     * Inspect files.
     * @param {object} baseConfig The base config to inspect.
     * @param {string[]} patterns The glob patterns of target files.
     * @returns {Promise<object>} The result config.
     */
    inspectFiles(baseConfig, patterns) {
        const config = this.normalizeConfig(baseConfig)
        const files = this.listFiles(patterns)
        const optionPatterns = new Set(this.optionPatterns)
        const queue = new PQueue({ concurrency: 8 })
        const peogress = debug.enabled ? null : new Progress(
            "Determining Config: :percent [:bar] :elapseds elapsed, eta :etas",
            { width: 30, total: files.length }
        )

        this.log("") // empty line.
        if (peogress) {
            peogress.tick(0) // progress bar.
        }

        debug("INSPECT %d patterns exist.", optionPatterns.size)
        for (const filePath of files) {
            // Use queue (concurrency:8) to read while linting.
            queue.add(() =>
                this.inspectFile(config, filePath, optionPatterns)
                    .then(() => peogress && peogress.tick())
            )
        }

        return queue.onIdle().then(() => {
            debug("INSPECT %d patterns passed.", optionPatterns.size)
            const ruleDefMap = this.linter.getRules()
            const rules = {}
            let countEnabled = 0
            let countDisabled = 0

            // Collect enabled rules.
            for (const entry of optionPatterns) {
                if (!rules[entry.ruleId]) {
                    debug("INSPECT adopted %j.", entry.pattern)
                    rules[entry.ruleId] = entry.pattern[entry.ruleId]
                    countEnabled += 1
                }
            }

            // Collect disabled rules.
            for (const ruleId of Object.keys(config.rules)) {
                if (!rules[ruleId] && config.rules[ruleId] === "off" && !ruleDefMap.get(ruleId).meta.deprecated) {
                    rules[ruleId] = "off"
                    countDisabled += 1
                }
            }

            this.log(`Enabled ${countEnabled} out of ${countEnabled + countDisabled} rules based on ${patterns.join(", ")}.`)
            return Object.assign({}, baseConfig, { rules })
        })
    }
}

/**
 * Inspect files.
 * @param {object} context The context info.
 * @param {string} context.cwd The path to the current working directory.
 * @param {string|null} context.packageJsonPath The path to `package.json` file if exists.
 * @param {function} context.log The function to display log messages.
 * @param {object} config The base config to inspect.
 * @param {string[]} patterns The glob patterns of target files.
 * @returns {Promise<object>} The result config.
 */
module.exports = (context, config, patterns) =>
    new InspectionContext(context).inspectFiles(config, patterns)
