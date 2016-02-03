# eslint-cli

[![npm version](https://img.shields.io/npm/v/eslint-cli.svg)](https://www.npmjs.com/package/eslint-cli)
[![Downloads/month](https://img.shields.io/npm/dm/eslint-cli.svg)](https://www.npmjs.com/package/eslint-cli)
[![Dependency Status](https://david-dm.org/mysticatea/eslint-cli.svg)](https://david-dm.org/mysticatea/eslint-cli)

The local [eslint](https://github.com/eslint/eslint) executor.

## Installation

```
> npm install -g eslint-cli
```

**Note:**

- The `eslint` module must not be installed into global.
- This module must be installed into global.

## Usage

First, please install the `eslint` module in local.

```
> npm install --save-dev eslint
```

Next, please do `eslint`.

```
> eslint lib
```

This command executes the global `eslint-cli`, then it finds and executes the local `eslint`.

That's all. Enjoy!
