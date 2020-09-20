// const JsonDir = require(`@brokfeld/jsondir`);
const JsonDir = require(`${__dirname}/../../src/JsonDir.js`);

(async () => {
  const users = new JsonDir(`${__dirname}/users`);
  const result = await users.find((content, file)=>{
    console.log(file);
    return content.age === 25;
  });
  console.log(result); // { file: 'user1', content: { name: 'Tom', age: 25 } }
})();

