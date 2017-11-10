/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * See LICENSE file in root directory for full license.
 */
"use strict"

module.exports = {
    es2015: () => ({
        type: "confirm",
        name: "es2015",
        message: "Are you using ECMAScript 2015 features?",
        default: false,
    }),
    modules: () => ({
        type: "confirm",
        name: "modules",
        message: "Are you using ES modules?",
        default: false,
        when(answers) {
            return answers.es2015 === true
        },
    }),
    envs: () => ({
        type: "checkbox",
        name: "envs",
        message: "Where will your code run?",
        default: ["browser"],
        choices: [
            { name: "Browser", value: "browser" },
            { name: "Node", value: "node" },
        ],
    }),
    commonjs: () => ({
        type: "confirm",
        name: "commonjs",
        message: "Do you use CommonJS?",
        default: false,
        when(answers) {
            return !answers.modules && answers.envs.indexOf("browser") !== -1
        },
    }),
    jsx: () => ({
        type: "confirm",
        name: "jsx",
        message: "Do you use JSX?",
        default: false,
    }),
    react: (context) => ({
        type: "confirm",
        name: "react",
        message: "Do you use React?",
        default: false,
        when(answers) {
            return answers.jsx && context.packageJsonPath != null
        },
    }),
}
