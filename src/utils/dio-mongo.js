const assert = require('assert');
const client = require('mongodb').MongoClient;

let _db;

const MONGO_CONNECTION_STRING = process.env.ZEPHYR_BLIZZDATA_MONGO_CONSTRING;

function initDb() {
  if (_db) {
    return Promise.resolve();
  }
  return client.connect(MONGO_CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((db) => _db = db);
}

function getDb() {
  assert.ok(_db, 'Db has not been initialized. Please call init');
  return _db;
}

module.exports = {
  getDb,
  initDb,
};
