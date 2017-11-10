/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * See LICENSE file in root directory for full license.
 */
"use strict"

const debug = require("debug")("eslint-cli")
const inquirer = require("inquirer")
const set = require("lodash/set")
const questions = require("../common-questions")

/**
 * Create configuration object by interactions.
 *
 * @param {object} context The context info.
 * @param {string} context.cwd The path to the current working directory.
 * @param {string|null} context.packageJsonPath The path to `package.json` file if exists.
 * @param {function} context.log The function to display log messages.
 * @returns {Promise<object>} The created config object.
 */
module.exports = (context) =>
    inquirer.prompt([
        questions.es2015(context),
        questions.modules(context),
        questions.envs(context),
        questions.commonjs(context),
        questions.jsx(context),
        questions.react(context),
        {
            type: "list",
            name: "indent",
            message: "What style of indentation do you use?",
            default: "tab",
            choices: [
                { name: "Tabs", value: "tab" },
                { name: "4 spaces", value: 4 },
                { name: "2 spaces", value: 2 },
            ],
        },
        {
            type: "list",
            name: "quotes",
            message: "What quotes do you use for strings?",
            default: "double",
            choices: [
                { name: "Double", value: "double" },
                { name: "Single", value: "single" },
            ],
        },
        {
            type: "list",
            name: "linebreak",
            message: "What line endings do you use?",
            default: "unix",
            choices: [
                { name: "Unix (LF)", value: "unix" },
                { name: "Windows (CRLF)", value: "windows" },
            ],
        },
        {
            type: "confirm",
            name: "semi",
            message: "Do you require semicolons?",
            default: true,
        },
    ]).then(answers => {
        debug("ANSWERS %j", answers)

        const config = {
            extends: ["eslint:recommended"],
            rules: {
                "indent": ["error", answers.indent],
                "quotes": ["error", answers.quotes],
                "linebreak-style": ["error", answers.linebreak],
                "semi": ["error", answers.semi ? "always" : "never"],
            },
        }

        if (answers.modules) {
            set(config, "parserOptions.sourceType", "module")
        }
        if (answers.es2015) {
            set(config, "parserOptions.ecmaVersion", 2015)
            set(config, "env.es6", true)
        }
        if (answers.commonjs) {
            set(config, "env.commonjs", true)
        }
        for (const env of answers.envs) {
            set(config, `env.${env}`, true)
        }

        if (answers.jsx) {
            set(config, "parserOptions.ecmaFeatures.jsx", true)
        }
        if (answers.react) {
            config.extends.push("plugin:react/recommended")
            config.plugins = ["react"]
            set(config, "parserOptions.ecmaFeatures.experimentalObjectRestSpread", true)
        }

        return config
    })
