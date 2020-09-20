# @brokfeld/jsondir

This module manages a directory of JSON files.

## Installation

```bash
# Install master branch
npm i git+https://github.com/brokfeld/jsondir.git#master

# or a specific version
npm i git+https://github.com/brokfeld/jsondir.git#v1.0.0
```

## Getting started

```js
const JsonDir = require(`./jsondir`);

(async () => {
  const users = new JsonDir(`./users`);
  await users.write(`user1`, { name: 'Tom' });
  const user1 = await users.read(`user1`);
  console.log(user1);
})();
```

More details at

* [API documentation](https://brokfeld.github.io/jsondir/docs/api/index.html)
* [Examples](./examples)
* [Changelog](./docs/changelog/README.md)

## Development

```bash
# Build API documentation
npm run build-api-doc
```

## License

[MIT](./LICENSE)
