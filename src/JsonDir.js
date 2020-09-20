const fs = require(`fs`).promises;
const fsRaw = require(`fs`);
const path = require(`path`);
const os = require(`os`);

const defaultOptions = {
  encoding: `utf8`,
  replacer: null,
  space: 2
};
if (os.platform() === `win32`) {
  defaultOptions.git = `C:\\Program Files\\Git\\bin\\git.exe`;
} else {
  if (os.platform() === `linux`) {
    defaultOptions.git = `/usr/bin/git`;
  } else {
    defaultOptions.git = `git`;
  }
}

// exec function to execute git commands on the cli
const child_process = require(`child_process`);
const exec = (...args) => {
  return new Promise((resolve, reject) => {
    child_process.exec(...args, (error, stdout, stderr) => {
      //console.log(error);
      //console.log(stdout);
      //console.log(stderr);
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
};

/**
 * This security function checks the filename.
 * If the filename contains not allowed chars like `..`,
 * this function will throw an error.
 * 
 * @param {String} name Name of the JSON file
 */
function checkFilename(file) {
  if (file.includes(`..`)) {
    throw new Error(`The filename '${file}' is not allowed.`);
  }
}

/**
 * Manages JSON files in a directory.
 * @param {String} dir Path of the JSON dir 
 * @param {JSON} [options] Options
 * @param {String} [options.encoding] Default is 'utf8'. Encoding of JSON files.
 * @param {String} [options.replacer] Default is null. Either a function or an array used to transform the result. The replacer is called for each item.
 * @param {String|Number} [options.space] Default is 2. A string to be used as white space (max 10 characters), or a Number, from 0 to 10, to indicate how many space characters to use as white space.
 * @param {String} [options.git] Default for Windows is 'C:\Program Files\Git\bin\git.exe' and for Linux is '/usr/bin/git'. Path to git binary.
 * @example
 * const JsonDir = require(`@brokfeld/jsondir`);
 * 
 * const users = new JsonDir(`./users`);
 */
class JsonDir {

  constructor(dir, options) {

    // Save dir and options
    this._dir = path.resolve(dir);
    this._options = Object.assign({}, defaultOptions, options);

    // Ensure dir
    try {
      fsRaw.mkdirSync(this._dir);
    } catch (error) {

    }

  }

  /**
   * Executes `git add` and `git commit` on a JSON file.
   * @param {String} file File name
   * @param {JSON} options JSON like `{ name: 'Max Mustermann', email: 'max@mustermann.de' }`
   * @param {String} options.name User name
   * @param {String} options.email User email
   * @param {String} [options.message] Commit message
   * @returns {Promise<JSON>} JSON like `{ stdout: '', stderr: ''}`
   * @example
   * const JsonDir = require(`@brokfeld/jsondir`);
   * 
   * (async () => {
   *   const users = new JsonDir(`${__dirname}/dir_with_git`);
   *   await users.write(`user1`, { random: Math.random() });
   *   await users.commit(`user1`, { name: `Max Mustermann`, email: `max@Mmustermann.de` });
   * })();
   */
  async commit(file, options) {

    checkFilename(file);

    let commitMessage = `${file}`;
    if (options.message) {
      commitMessage += `: ${options.message}`;
    }

    let cmd = ``;
    cmd += `"${this._options.git}" add "${file}.json" && `;
    cmd += `"${this._options.git}" commit -m "${commitMessage}" --author="${options.name} <${options.email}>"`;

    try {
      return await exec(cmd, { cwd: this._dir });
    } catch (error) {

      // If no git repository exists, create it
      if (error.message.includes(`not a git repository`)) {
        const cmdGitInit = `git init`;
        await exec(cmdGitInit, { cwd: this._dir })
        return await exec(cmd, { cwd: this._dir });
      } else {
        throw error;
      }
    }
  }

  /**
   * Counts the number of JSON files.
   * @returns {Promise<Number>} Number of JSON files
   * @example
   * const JsonDir = require(`@brokfeld/jsondir`);
   * 
   * (async () => {
   *   const users = new JsonDir(`${__dirname}/users`);
   *   const count = await users.count();
   *   console.log(count); // 2
   * })();
   */
  async count() {
    let counter = 0;
    const files = await fs.readdir(this._dir);
    for (let i = 0; i < files.length; i++) {
      if (files[i].endsWith(`.json`)) {
        counter++;
      }
    }
    return counter;
  }

  /**
   * Deletes a JSON file
   * @param {String} file File name
   * @returns {Promise}
   * @example
   * const JsonDir = require(`@brokfeld/jsondir`);
   * 
   * (async () => {
   *   const users = new JsonDir(`${__dirname}/users`);
   *   await users.write(`user1`, { name: `Tom` });
   *   await users.delete(`user1`);
   * })();
   */
  async delete(file) {
    checkFilename(file);
    return await fs.unlink(`${this._dir}/${file}.json`);
  }

  /**
    * The find() method returns the value of the first JSON file in the JSON dir that pass a test (provided as a function).
    * @param {Function} func Function like `(content, file) => { return true; }`
    * @returns {Promise<JSON> | Promise<null>}
    * @example
    * const JsonDir = require(`@brokfeld/jsondir`);
    * 
    * (async () => {
    *   const users = new JsonDir(`${__dirname}/users`);
    *   const result = await users.find((content, file)=>{
    *     console.log(file);
    *     return content.age === 25;
    *   });
    *   console.log(result); // { file: 'user1', content: { name: 'Tom', age: 25 } }
    * })();
    */
  async find(func) {
    let result = null;
    const files = await fs.readdir(this._dir);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.endsWith(`.json`)) {
        const filename = file.substr(0, file.length - 5);
        const content = JSON.parse(await fs.readFile(`${this._dir}/${file}`, { encoding: this._options.encoding }));
        if (func(content, filename)) {
          result = { file: filename, content };
          break;
        }
      }
    }
    return result;
  }

  /**
   * The findAll() method returns the value of the all JSON files in the JSON dir that pass a test (provided as a function).
   * @param {Function} func Function like `(content, file) => { return true; }`
   * @returns {Promise<Array<JSON>> | Promise<null>}
   * @example
   * const JsonDir = require(`@brokfeld/jsondir`);
   * 
   * (async () => {
   *   const users = new JsonDir(`${__dirname}/users`);
   *   const result = await users.findAll((content, file)=>{
   *     console.log(file);
   *     return content.age === 25;
   *   });
   *   console.log(result);
   *   // [
   *   //   { file: 'user1', content: { name: 'Tom', age: 25 } },
   *   //   { file: 'user2', content: { name: 'Max', age: 25 } } 
   *   // ]
   * })();
   */
  async findAll(func) {

    let result = [];
    const files = await fs.readdir(this._dir);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.endsWith(`.json`)) {
        const filename = file.substr(0, file.length - 5);
        const content = JSON.parse(await fs.readFile(`${this._dir}/${file}`, { encoding: this._options.encoding }));
        if (func(content, filename)) {
          result.push({ file: filename, content });
        }
      }
    }

    if (result.length === 0) {
      result = null;
    }

    return result;
  }

  /**
   * The forEach() method calls a function once for each JSON file in the JSON dir, in order.
   * @param {Function} func Function like `(content, file) => {}`
   * @returns {Promise}
   * @example
   * const JsonDir = require(`@brokfeld/jsondir`);
   * 
   * (async () => {
   *   const users = new JsonDir(`${__dirname}/users`);
   * 
   *   const names = [];
   *   await users.forEach((content, file) => { 
   *     console.log(file);
   *     names.push(content.name);
   *   });
   *   console.log(names);
   * })();
   */
  async forEach(func) {
    const files = await fs.readdir(this._dir);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.endsWith(`.json`)) {
        const filename = file.substr(0, file.length - 5);
        const content = JSON.parse(await fs.readFile(`${this._dir}/${file}`, { encoding: this._options.encoding }));
        func(content, filename);
      }
    }
  }

  /**
   * The map() method creates a new array with the results of calling a function for every JSON file.
   * @param {Function} func Mapping function like `(content, file) => {}`
   * @returns {Promise<Array>}
   * @example
   * const JsonDir = require(`@brokfeld/jsondir`);
   * 
   * (async () => {
   *   const users = new JsonDir(`${__dirname}/users`);
   *   const usernames = await users.map((content, file) => {
   *     console.log(file);
   *     return content.name;
   *   });
   *   console.log(usernames); // [ 'Tom', 'Max' ]
   * })();
   */
  async map(func) {
    const all = [];
    const files = await fs.readdir(this._dir);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.endsWith(`.json`)) {
        all.push(func(JSON.parse(await fs.readFile(`${this._dir}/${file}`, { encoding: this._options.encoding })), file.substr(0, file.length - 5)));
      }
    }
    return all;
  }

  /**
    * Returns file names.
    * @returns {Promise<String[]>} For example `["filename1", "filename2"]`
    * @example
    * const JsonDir = require(`@brokfeld/jsondir`);
    * 
    * (async () => {
    *   const users = new JsonDir(`${__dirname}/users`);
    *   const names = await users.names();
    *   console.log(names); // [ 'user1', 'user2' ]
    * })();
    */
  async names() {
    const all = [];
    const files = await fs.readdir(this._dir);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.endsWith(`.json`)) {
        all.push(file.substr(0, file.length - 5));
      }
    }
    return all;
  }


  /**
   * Reads a JSON file.
   * @param {String} file File name
   * @returns {Promise<JSON>} Read JSON file
   * @example
   * const JsonDir = require(`@brokfeld/jsondir`);
   * 
   * (async () => {
   *   const users = new JsonDir(`${__dirname}/users`);
   *   const u1 = await users.read(`user1`);
   *   const u2 = await users.read(`user2`);
   *   console.log(u1, u2); // { name: 'Tom' } { name: 'Max' }
   * })();
   */
  async read(file) {
    checkFilename(file);
    return JSON.parse(await fs.readFile(`${this._dir}/${file}.json`, { encoding: this._options.encoding }));
  }

  /**
   * Returns all JSON files as single JSON.
   * @returns {Promise<JSON>} For example `{ "filename1": {}, "filename2": {} }`
   * @example
   * const JsonDir = require(`@brokfeld/jsondir`);
   * 
   * (async () => {
   *   const users = new JsonDir(`${__dirname}/users`);
   *   const all = await users.readAll();
   *   console.log(all); // { user1: { name: 'Tom' }, user2: { name: 'Max' } }
   * })();
   */
  async readAll() {
    const all = {};
    const files = await fs.readdir(this._dir);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.endsWith(`.json`)) {
        const name = file.substr(0, file.length - 5);
        all[name] = JSON.parse(await fs.readFile(`${this._dir}/${file}`, { encoding: this._options.encoding }));
      }
    }
    return all;
  }

  /**
   * Renames a JSON file
   * @param {String} oldFile Old file name
   * @param {String} newFile new file name
   * @returns {Promise}
   * @example
   * const JsonDir = require(`@brokfeld/jsondir`);
   * 
   * (async () => {
   *   const users = new JsonDir(`${__dirname}/users`);
   *   await users.write(`user1`, { name: `Tom` });
   *   await users.rename(`user1`,`user2`);
   * })();
   */
  async rename(oldFile, newFile) {
    checkFilename(oldFile);
    checkFilename(newFile);
    return fs.rename(`${this._dir}/${oldFile}.json`, `${this._dir}/${newFile}.json`);
  }


  /**
   * Saves a JSON file.
   * @param {String} file File name
   * @param {JSON} content JSON to be saved
   * @returns {Promise} 
   * @example
   * const JsonDir = require(`@brokfeld/jsondir`);
   * 
   * (async () => {
   *   const users = new JsonDir(`${__dirname}/users`);
   *   await users.write(`user1`, { name: `Tom` });
   *   await users.write(`user2`, { name: `Max` });
   * })();
   */
  async write(file, content) {
    checkFilename(file);
    return await fs.writeFile(`${this._dir}/${file}.json`, JSON.stringify(content, this._options.replacer, this._options.space), { encoding: this._options.encoding });
  }

  /**
   * Saves several JSON files.
   * @param {JSON} content JSON files to be saved. For example`{ "filename1": {}, "filename2": {} }` 
   * @returns {Promise} 
   * @example
   * const JsonDir = require(`@brokfeld/jsondir`);
   * 
   * (async () => {
   *   const users = new JsonDir(`${__dirname}/users`);
   *   await users.writeAll({
   *     user1: { name: `Tom` },
   *     user2: { name: `Max` }
   *   });
   * })();
   */
  async writeAll(content) {
    for (const file in content) {
      checkFilename(file);
      await fs.writeFile(`${this._dir}/${file}.json`, JSON.stringify(content[file], this._options.replacer, this._options.space), { encoding: this._options.encoding });
    }
  }

}

module.exports = JsonDir;