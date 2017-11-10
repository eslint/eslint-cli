/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * See LICENSE file in root directory for full license.
 */
"use strict"

const debug = require("debug")("eslint-cli")
const spawnNpm = require("./spawn-npm")

/**
 * Install given packages with `npm install --save-dev` command.
 * @param {object} context The context info.
 * @param {string} context.cwd The path to the current working directory.
 * @param {string|null} context.packageJsonPath The path to `package.json` file if exists.
 * @param {function} context.log The function to display log messages.
 * @param {string[]} packageNames The package names to install.
 * @returns {Promise<void>} -
 */
module.exports = (context, packageNames) => {
    if (packageNames.length === 0) {
        debug("NO_DEPS")
        return Promise.resolve()
    }

    context.log("Installing dependencies:", packageNames.map(name => `\n    ${name}`).join(""))
    return spawnNpm(
        ["install", "--save-dev"].concat(packageNames),
        { cwd: context.cwd, stdio: "inherit" }
    )
}
