// const JsonDir = require(`@brokfeld/jsondir`);
const JsonDir = require(`${__dirname}/../../src/JsonDir.js`);

(async () => {
  const users = new JsonDir(`${__dirname}/users`);
  const u1 = await users.read(`user1`);
  const u2 = await users.read(`user2`);
  console.log(u1, u2); // { name: 'Tom' } { name: 'Max' }
})();

