# lasso-fs-writer

A plugin for [`lasso`](https://github.com/lasso-js/lasso) that will allow you to use a custom FS when writing files.
This is useful for things like saving the output to [memory](https://github.com/webpack/memory-fs).

> WARNING: `lasso-fs-writer` should only be used to do Lasso with prebuilds.

## Usage

```js
const fs = require('memory-fs');
require('lasso').configure({
  plugins: [
    {
      plugin: 'lasso-fs-writer',
      config: {
        fileSystem: new MemoryFS()
      }
    }
  ],
  ...
});
```

## Configuration Properties

- `fileSystem` {Object} - The new file system to use.
