/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * See LICENSE file in root directory for full license.
 */
"use strict"

const inquirer = require("inquirer")

/**
 * Prompt the method to configure ESLint.
 * @returns {Promise<{method:string}>} The result of the prompt.
 */
module.exports = () =>
    inquirer.prompt([
        {
            type: "list",
            name: "method",
            message: "How would you like to configure ESLint?",
            default: "style",
            choices: [
                { name: "Answer questions about your style", value: "style" },
                { name: "Use a popular style guide", value: "guide" },
                { name: "Inspect your JavaScript file(s)", value: "files" },
            ],
        },
    ])
