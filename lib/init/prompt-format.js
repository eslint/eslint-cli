/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * See LICENSE file in root directory for full license.
 */
"use strict"

const fs = require("fs")
const inquirer = require("inquirer")
const get = require("lodash/get")
const semver = require("semver")
const fetchPluginsAndConfigs = require("./npm-util/fetch-plugins-and-configs")

/**
 * Read a file as JSON.
 * @param {string} filePath The path to the target file.
 * @returns {any} The data of the file.
 */
function readJSON(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, "utf8", (readError, jsonText) => {
            if (readError != null) {
                reject(readError)
                return
            }

            try {
                resolve(JSON.parse(jsonText.trim() || "{}"))
            }
            catch (parseError) {
                reject(parseError)
            }
        })
    })
}

/**
 * Check whether the local ESLint version conflicts with the required version of the current config.
 * @param {object} context The context info.
 * @param {string} context.cwd The path to the current working directory.
 * @param {string|null} context.packageJsonPath The path to `package.json` file if exists.
 * @param {function} context.log The function to display log messages.
 * @param {object} config The config object.
 * @param {object} answers The answers object. This adds two properties to this object.
 * @returns {Promise<boolean>} `true` if the local ESLint is found then it conflicts with the required version.
 */
function hasESLintVersionConflict(context, config, answers) {
    // Get the local ESLint version.
    return readJSON(context.packageJsonPath).then(packageJsonData => {
        answers.actualVersionRange = get(packageJsonData, "devDependencies.eslint")

        if (semver.validRange(answers.actualVersionRange)) {
            return fetchPluginsAndConfigs(context, config, true)
        }
        return null
    }).then(packages => {
        if (packages == null) {
            return false
        }

        const eslintId = packages.find(id => id.startsWith("eslint@"))
        answers.expectedVersionRange = eslintId && eslintId.split("@")[1]
        if (!semver.validRange(answers.expectedVersionRange)) {
            return false
        }

        // Check the version.
        return !semver.intersects(
            answers.actualVersionRange,
            answers.expectedVersionRange
        )
    })
}

/**
 * Prompt the format to save configuration file.
 * @param {object} context The context info.
 * @param {string} context.cwd The path to the current working directory.
 * @param {string|null} context.packageJsonPath The path to `package.json` file if exists.
 * @param {function} context.log The function to display log messages.
 * @param {object} config The config object.
 * @returns {Promise<{fileType:string,installESLint:boolean}>} The result of the prompt.
 */
module.exports = (context, config) =>
    inquirer.prompt([
        {
            type: "list",
            name: "fileType",
            message: "What format do you want your config file to be in?",
            default: ".js",
            choices: [
                { name: "JavaScript", value: ".js" },
                { name: "YAML", value: ".yml" },
                { name: "JSON", value: ".json" },
            ],
        },
        {
            type: "confirm",
            name: "installESLint",
            default: true,
            when(answers) {
                return hasESLintVersionConflict(context, config, answers)
            },
            message(answers) {
                return `It requires 'eslint@${answers.expectedVersionRange}', but you are using 'eslint@${answers.actualVersionRange}'.\n  Do you want to install the proper ESLint?`
            },
        },
    ])
