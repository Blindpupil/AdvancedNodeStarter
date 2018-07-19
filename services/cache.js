const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');
const keys = require('../config/keys');

const client = redis.createClient(keys.redisUrl);
client.hget = util.promisify(client.hget);

// Reference the original exec function
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function(options = {}) {
  this.useCache = true;
  this.hashKey = JSON.stringify(options.key || '');

  // returning this allows us to maintain the possibility of chaining functions to the query, like: blog.find({...}).cache().limit(n) etc...
  return this;
};

mongoose.Query.prototype.exec = async function () {

  if (!this.useCache) {
   return exec.apply(this, arguments);
  }

  const key = JSON.stringify(Object.assign({}, this.getQuery(), {
    collection: this.mongooseCollection.name
  }));

  // See if we have a value for key in Redis
  const cachedValue = await client.hget(this.hashKey, key);

  // If we do return that
  if (cachedValue) {
    const doc = JSON.parse(cachedValue);

    return Array.isArray(doc)
      ? doc.map(d => new this.model(d))
      : new this.model(doc);
  }

  // Otherwise store the result in redis and issue the query
  const result = await exec.apply(this, arguments);
  client.hset(this.hashKey, key, JSON.stringify(result));

  return result;
};

module.exports = {
  clearHash(haskHey) {
    client.del(JSON.stringify(haskHey));
  }
};