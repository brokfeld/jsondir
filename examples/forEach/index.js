// const JsonDir = require(`@brokfeld/jsondir`);
const JsonDir = require(`${__dirname}/../../src/JsonDir.js`);

(async () => {
  const users = new JsonDir(`${__dirname}/users`);

  const names = [];
  await users.forEach((content, file) => { 
    console.log(file);
    names.push(content.name);
  });
  console.log(names);

})();
