// const JsonDir = require(`@brokfeld/jsondir`);
const JsonDir = require(`${__dirname}/../../src/JsonDir.js`);

(async () => {
  const users = new JsonDir(`${__dirname}/users`);
  const usernames = await users.map((content, file) => {
    console.log(file);
    return content.name;
  });
  console.log(usernames); // [ 'Tom', 'Max' ]
})();

