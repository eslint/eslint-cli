# eslint-cli

[![npm version](https://img.shields.io/npm/v/eslint-cli.svg)](https://www.npmjs.com/package/eslint-cli)
[![Downloads/month](https://img.shields.io/npm/dm/eslint-cli.svg)](http://www.npmtrends.com/eslint-cli)
[![Dependency Status](https://david-dm.org/eslint/eslint-cli.svg)](https://david-dm.org/eslint/eslint-cli)

The local [ESLint] executor.

## ⤴️ Motivation

ESLint recommends that we install ESLint into project-local rather than global.

    $ npm install --save-dev eslint

In that case, there are many merits, but `eslint` CLI command is not available.

    # This is error:
    $ eslint src

    # So you have to use:
    $ ./node_modules/.bin/eslint src

It's inconvenient a bit. This package gives you `eslint` CLI command which runs local installed ESLint.

## 💿 Installation

Use [npm] to install.

    $ npm install -g eslint-cli

**Note:**

- The `eslint` package must not be installed into global.
- This package must be installed into global.

## 📖 Usage

First, install the `eslint` package into project-local.

    $ npm install --save-dev eslint

Next, use `eslint` CLI command.

    $ eslint src

The command runs the global-installed `eslint-cli`, then it finds and runs the local-installed `eslint`.

That's all. Enjoy!

## 📰 Change logs

- See [GitHub releases](https://github.com/eslint/eslint-cli/releases)

## 🍻 Contributing

Contributing is welcome!

Please use issues/PRs of GitHub.

[eslint]: http://eslint.org/
[npm]: https://www.npmjs.com/
