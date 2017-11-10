/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * See LICENSE file in root directory for full license.
 */
"use strict"

const Buffer = require("buffer").Buffer
const spawn = require("cross-spawn")
const debug = require("debug")("eslint-cli")

/**
 * Spawn `npm` with the given arguments.
 * @param {string[]} args The arguments.
 * @param {object} options Options of `child_process.spawn`.
 * @returns {Promise<string|null>} The string of `stdout` of the child process.
 * If `options.stdio` is `"inherit"`, this returns nothing.
 */
module.exports = (args, options) =>
    new Promise((resolve, reject) => {
        const needsStdout = options.stdio !== "inherit"

        debug("EXEC npm %s", args.join(" "))
        const cp = spawn("npm", args, options)

        cp.on("error", (error) => {
            debug("EXEC error '%s'", error.message)
            if ((error && error.code) === "ENOENT") {
                error.code = "NPM_NOT_FOUND"
            }
            reject(error)
        })

        const stdoutChunks = []
        if (needsStdout) {
            cp.stdout.on("data", (chunk) => {
                stdoutChunks.push(chunk)
            })
        }

        cp.on("close", (exitCode) => {
            debug("EXEC finish '%s'", String(exitCode))
            if (exitCode) {
                reject(new Error(`npm exited with non-zero code: ${exitCode}`))
            }
            else {
                resolve(needsStdout ? Buffer.concat(stdoutChunks).toString() : null)
            }
        })
    })
