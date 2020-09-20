// const JsonDir = require(`@brokfeld/jsondir`);
const JsonDir = require(`${__dirname}/../../src/JsonDir.js`);

(async () => {
  const users = new JsonDir(`${__dirname}/../../../commit_dir`);
  await users.write(`user1`, { random: Math.random() });
  await users.commit(`user1`, { name: `Max Mustermann`, email: `max@Mmustermann.de`, message: `Create user`});
})();
