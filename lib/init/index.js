/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * See LICENSE file in root directory for full license.
 */
"use strict"

const path = require("path")
const debug = require("debug")("eslint-cli")
const pkgUp = require("pkg-up")
const fetchPluginsAndConfigs = require("./npm-util/fetch-plugins-and-configs")
const installPackages = require("./npm-util/install-packages")
const promptMethod = require("./prompt-method")
const promptFormat = require("./prompt-format")
const saveConfigFile = require("./save-config-file")

//eslint-disable-next-line no-console
const log = console.log.bind(console)

// Error messages.
const MESSAGES = Object.create(null)
MESSAGES.NPM_NOT_FOUND = `
The CLI command 'npm' was not found.
It's required in order to manage dependent packages such as plugins/configs.

Please ensure Node.js is installed correctly.
`
MESSAGES.PACKAGE_JSON_NOT_FOUND = `
The file 'package.json' was not found.
It's required in order to manage dependent packages such as config preset.

Please do 'npm init' before 'eslint --init'.

Further reading: https://docs.npmjs.com/cli/init
`

/**
 * Initialize ESLint for the current project.
 * @param {string} cwd The path to the current working directory.
 * @returns {void}
 */
module.exports = (cwd) => {
    debug("START --init on '%s'", cwd)

    const packageJsonPath = pkgUp.sync(cwd)
    const context = { cwd, packageJsonPath, log }
    let config = null
    let format = null

    return Promise.resolve().then(() => {
        if (!packageJsonPath) {
            const error = new Error("package.json not found")
            error.code = "PACKAGE_JSON_NOT_FOUND"
            throw error
        }

        // Ask to choose the method to initialize.
        return promptMethod()
    }).then(answers => {
        debug("METHOD '%s'", answers.method)

        // Ask to configure user's preference.
        const promptConfig = require(`./prompt-config/${answers.method}`)
        return promptConfig(context)
    }).then(config0 => {
        debug("CONFIG '%j'", config0)
        config = config0

        // Ask to choose the saving format.
        return promptFormat(context, config)
    }).then(format0 => {
        debug("FORMAT '%j'", format0)
        format = format0

        // Install dependencies into project-local (including ESLint itself).
        const installESLint = format.installESLint !== false
        return fetchPluginsAndConfigs(context, config, installESLint)
    }).then(packages =>
        installPackages(context, packages)
    ).then(() => {
        // Execute postprocess if exists.
        if (config.$postprocess != null) {
            const postprocess = config.$postprocess
            delete config.$postprocess

            return postprocess()
        }
        return config
    }).then(config0 => {
        config = config0

        // Save the generated config.
        const filePath = path.join(cwd, `.eslintrc${format.fileType}`)
        return saveConfigFile(filePath, config)
    }).catch(error => {
        log(MESSAGES[error.code] || error.stack)
        process.exitCode = 1
    })
}
