// const JsonDir = require(`@brokfeld/jsondir`);
const JsonDir = require(`${__dirname}/../../src/JsonDir.js`);

(async () => {
  const users = new JsonDir(`${__dirname}/users`);
  const all = await users.readAll();
  console.log(all); // { user1: { name: 'Tom' }, user2: { name: 'Max' } }
})();
