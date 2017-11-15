/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * See LICENSE file in root directory for full license.
 */
"use strict"

const debug = require("debug")("eslint-cli")
const inquirer = require("inquirer")
const set = require("lodash/set")
const questions = require("../common-questions")
const inspectSourceCode = require("../inspect-util/inspect")
const SP = /\s+/g

/**
 * Prompt the user's style.
 * @param {object} context The context info.
 * @param {string} context.cwd The path to the current working directory.
 * @param {string|null} context.packageJsonPath The path to `package.json` file if exists.
 * @param {function} context.log The function to display log messages.
 * @returns {Promise<object>} The created config object.
 */
module.exports = (context) =>
    inquirer.prompt([
        {
            type: "input",
            name: "patterns",
            message: "Which file(s), path(s), or glob(s) should be examined?",
            filter(input) {
                return input.trim().split(SP).filter(Boolean)
            },
            validate(input) {
                if (input.length === 0) {
                    return "You must tell us what code to examine. Try again."
                }
                return true
            },
        },
        questions.es2015(context),
        questions.modules(context),
        questions.envs(context),
        questions.commonjs(context),
        questions.jsx(context),
        questions.react(context),
    ]).then(answers => {
        debug("ANSWERS %j", answers)
        const config = {
            extends: ["eslint:recommended"],
        }

        if (answers.es2015) {
            set(config, "env.es6", true)
            if (answers.modules) {
                set(config, "parserOptions.sourceType", "module")
            }
        }
        if (answers.commonjs) {
            set(config, "env.commonjs", true)
        }
        for (const envKey of answers.envs) {
            set(config, `env.${envKey}`, true)
        }

        if (answers.jsx) {
            if (answers.react) {
                config.extends.push("plugin:react/recommended")
                config.plugins = ["react"]
                set(config, "parserOptions.ecmaFeatures.experimentalObjectRestSpread", true)
            }
            set(config, "parserOptions.ecmaFeatures.jsx", true)
        }

        // Inspect files after install deps.
        config.$postprocess =
            inspectSourceCode.bind(null, context, config, answers.patterns)

        return config
    })
