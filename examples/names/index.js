// const JsonDir = require(`@brokfeld/jsondir`);
const JsonDir = require(`${__dirname}/../../src/JsonDir.js`);

(async () => {
  const users = new JsonDir(`${__dirname}/users`);
  const names = await users.names();
  console.log(names); // [ 'user1', 'user2' ]
})();

