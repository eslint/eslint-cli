# eslint-cli

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
