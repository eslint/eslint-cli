/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * See LICENSE file in root directory for full license.
 */
"use strict"

const debug = require("debug")("eslint-cli")
const inquirer = require("inquirer")

/**
 * Prompt the method to configure ESLint.
 * @param {object} _context The context info.
 * @param {string} _context.cwd The path to the current working directory.
 * @param {string|null} _context.packageJsonPath The path to `package.json` file if exists.
 * @param {function} _context.log The function to display log messages.
 * @returns {Promise<object>} The created config object.
 */
module.exports = (_context) =>
    inquirer.prompt([
        {
            type: "list",
            name: "styleguide",
            message: "Which style guide do you want to follow?",
            choices: [
                { name: "Google", value: "google" },
                { name: "Airbnb", value: "airbnb-base" },
                { name: "Standard", value: "standard" },
            ],
        },
        {
            type: "confirm",
            name: "react",
            message: "Do you use React?",
            default: false,
            when(answers) {
                return answers.styleguide === "airbnb-base"
            },
        },
    ]).then(answers => {
        debug("ANSWERS %j", answers)
        return { extends: (answers.react ? "airbnb" : answers.styleguide) }
    })
