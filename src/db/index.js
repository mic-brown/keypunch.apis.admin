import { MongoClient } from 'mongodb';
import { MONGO_CONNECTION, DEFAULT_MONGO_DB } from '../settings';
import logger from '../logger';

const state = {
  client: null,
};

export const connect = () => new Promise((resolve, reject) => {
  try {
    if (MONGO_CONNECTION) {
      logger.info(`attempting to connect to ${MONGO_CONNECTION}`);
      MongoClient.connect(MONGO_CONNECTION, {
        useUnifiedTopology: true,
      }, (err, client) => {
        if (err) {
          logger.error(`error connecting to database ${MONGO_CONNECTION}, ${err}`);
          reject(err);
        } else {
          state.client = client;
          logger.info(`successfully connected to ${MONGO_CONNECTION}`);
          resolve(client);
        }
      });
    } else {
      resolve();
    }
  } catch (error) {
    reject(error);
  }
});

export const close = () => new Promise((resolve, reject) => {
  try {
    if (state.client) {
      state.client.close((err, result) => {
        if (err) {
          logger.error(`error closing connection to ${MONGO_CONNECTION}, ${err}`);
          reject(err);
        } else {
          logger.info(`successfully closed connection to ${MONGO_CONNECTION}`);
          state.db = null;
          resolve(result);
        }
      });
    } else {
      resolve();
    }
  } catch (error) {
    reject(error);
  }
});

export const findOne = async (
  collectionName,
  filter = {},
  options = {},
  dbName = DEFAULT_MONGO_DB,
) => {
  const collection = state.client.db(dbName).collection(collectionName);
  const result = await collection.findOne(filter, options);
  return result;
};

export const find = (
  collectionName,
  filter = {},
  options = {},
  dbName = DEFAULT_MONGO_DB,
) => {
  const collection = state.client.db(dbName).collection(collectionName);
  const cursor = collection.find(filter, options);

  return cursor;
};

export const insertOne = async (
  collectionName,
  doc,
  options = {},
  dbName = DEFAULT_MONGO_DB,
) => {
  const collection = state.client.db(dbName).collection(collectionName);
  return await collection.insertOne(doc, options);
};

export const insertMany = async (
  collectionName,
  docs = [],
  options = {},
  dbName = DEFAULT_MONGO_DB,
) => {
  const collection = state.client.db(dbName).collection(collectionName);
  return await collection.insertMany(docs, options);
};

export const replaceOne = async (
  collectionName,
  doc,
  options = { upsert: false },
  dbName = DEFAULT_MONGO_DB,
) => {
  const { _id } = doc;
  const collection = state.client.db(dbName).collection(collectionName);
  return await collection.replaceOne({ _id }, doc, options);
};

export const updateOne = async (
  collectionName,
  filter,
  update,
  options = {},
  dbName = DEFAULT_MONGO_DB,
) => {
  const collection = state.client.db(dbName).collection(collectionName);
  return await collection.updateOne(filter, update, options);
};

export const updateMany = async (
  collectionName,
  filter,
  update,
  options = { upsert: false },
  dbName = DEFAULT_MONGO_DB,
) => {
  const collection = state.client.db(dbName).collection(collectionName);
  return await collection.updateMany(filter, update, options);
};

export const deleteOne = async (
  collectionName,
  filter,
  options = {},
  dbName = DEFAULT_MONGO_DB,
) => {
  const collection = state.client.db(dbName).collection(collectionName);
  return await collection.deleteOne(filter, options);
};

export const deleteMany = async (
  collectionName,
  query,
  options = {},
  dbName = DEFAULT_MONGO_DB,
) => {
  const collection = state.client.db(dbName).collection(collectionName);
  return await collection.deleteMany(query, options);
};

export const aggregate = async (
  collectionName,
  pipeline = [],
  options = {},
  dbName = DEFAULT_MONGO_DB,
) => {
  const collection = state.client.db(dbName).collection(collectionName);
  const cursor = collection.aggregate(pipeline, options || undefined);
  return Promise.resolve(cursor);
};

export const count = async (
  collectionName,
  filter = {},
  options = {},
  dbName = DEFAULT_MONGO_DB,
) => {
  const collection = state.client.db(dbName).collection(collectionName);
  return await collection.find(filter, { _id: 1 }, options).count();
};

export const startSession = (options = {}) => state.client.startSession(options);

export const client = () => state?.client;

export default {
  connect,
  close,
  client,
  find,
  findOne,
  insertOne,
  insertMany,
  replaceOne,
  updateMany,
  deleteOne,
  deleteMany,
  aggregate,
  startSession,
};
