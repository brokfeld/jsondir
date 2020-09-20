// const JsonDir = require(`@brokfeld/jsondir`);
const JsonDir = require(`${__dirname}/../../src/JsonDir.js`);

(async () => {
  const users = new JsonDir(`${__dirname}/users`);
  await users.write(`user1`, { name: `Tom` });
  await users.delete(`user1`);
})();

