const MONGO_CONNECTION = 'mongodb://mongoadmin:secret@localhost:27017/?authSource=admin';
const DEFAULT_MONGO_DB = 'default-db';

const mockLogInfo = jest.fn();
const mockLogError = jest.fn();
const mockCount = jest.fn(() => 45 );
const mockFindOne = jest.fn(() => Promise.resolve({ _id: 10, value: 'string' }));
const mockFind = jest.fn(() => ({ cursor: true, count: mockCount }));
const mockInsertOne = jest.fn(() => ({ acknowledged: true }));
const mockInsertMany = jest.fn(() => ({ acknowledged: true }));
const mockReplaceOne = jest.fn(() => ({ acknowledged: true }));
const mockUpdateOne = jest.fn(() => ({ acknowledged: true }));
const mockUpdateMany = jest.fn(() => ({ acknowledged: true }));
const mockDeleteOne = jest.fn(() => ({ acknowledged: true }));
const mockDeleteMany = jest.fn(() => ({ acknowledged: true }));
const mockAggregate = jest.fn(() => ({ recordCount: 256 }));
const mockStartSession = jest.fn(() => ({ }));

const mockCollection = jest.fn(() => ({
  findOne: mockFindOne,
  find: mockFind,
  insertOne: mockInsertOne,
  insertMany: mockInsertMany,
  replaceOne: mockReplaceOne,
  updateOne: mockUpdateOne,
  updateMany: mockUpdateMany,
  deleteOne: mockDeleteOne,
  deleteMany: mockDeleteMany,
  aggregate: mockAggregate,
  count: mockCount,
}));
const mockDb = jest.fn(() => ({
  collection: mockCollection,
}));
const mockClose = jest.fn((callBack) => {
  callBack(undefined, { closed: true });
});
const mockClient = {
  close: mockClose,
  db: mockDb,
  startSession: mockStartSession,
};
const mockConnnect = jest.fn((_connectionString, _options, callBack) => {
  callBack(undefined, mockClient);
});
jest.mock('../../src/logger', () => ({
  __esModule: true,
  info: mockLogInfo,
  error: mockLogError,
  default: {
    info: mockLogInfo,
    error: mockLogError,
  },
}));
jest.mock('../../src/settings', () => ({
  __esModule: true,
  MONGO_CONNECTION,
  DEFAULT_MONGO_DB,
  default: {
    MONGO_CONNECTION,
    DEFAULT_MONGO_DB,
  },
}));
jest.doMock('mongodb', () => ({
  MongoClient: {
    connect: mockConnnect,
  },
}));

const {
  connect,
  client: getClient,
  close,
  findOne,
  find,
  insertOne,
  insertMany,
  replaceOne,
  updateOne,
  updateMany,
  deleteOne,
  deleteMany,
  aggregate,
  count,
  startSession,
} = require('../../src/db');

describe('db', () => {
  describe('when a connection string is configured', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    it('it should be possible to connect to the database', async () => {
      const client = await connect();
      expect(mockConnnect).toBeCalledWith(
        MONGO_CONNECTION, { useUnifiedTopology: true }, expect.any(Function),
      );
      expect(client).toBe(mockClient);
      expect(mockLogInfo).toBeCalledWith(`successfully connected to ${MONGO_CONNECTION}`);
    });
    it('it should be possible to retrieve an instance of the client', async () => {
      await connect();
      const client = getClient();
      expect(client).toBe(mockClient);
    });
    it('it should be possible to close the connection', async () => {
      await connect();
      const result = await close();
      expect(mockClose).toBeCalled();
      expect(mockLogInfo).toBeCalledWith(`successfully closed connection to ${MONGO_CONNECTION}`);
      expect(result).toEqual({ closed: true });
    });
    it('it should be possible to find a record', async () => {
      await connect();
      const result = await findOne('test-collection', { _id: 10 });
      expect(mockDb).toBeCalledWith(DEFAULT_MONGO_DB);
      expect(mockCollection).toBeCalledWith('test-collection');
      expect(mockFindOne).toBeCalledWith({ _id: 10 }, {});
      expect(result).toEqual({ _id: 10, value: 'string' });
    });
    it('it should be possible to find many records', async () => {
      await connect();
      const result = await find('test-collection-2', { value: { $gt: 5 }});
      expect(mockDb).toBeCalledWith(DEFAULT_MONGO_DB);
      expect(mockCollection).toBeCalledWith('test-collection-2');
      expect(mockFind).toBeCalledWith({ value: { $gt: 5 }}, {});
      expect(result).toEqual({ cursor: true, count: mockCount });
    });
    it('it should be possible to insert a record', async () => {
      await connect();
      const result = await insertOne('test-collection-3', { _id: 2, value: 5 });
      expect(mockDb).toBeCalledWith(DEFAULT_MONGO_DB);
      expect(mockCollection).toBeCalledWith('test-collection-3');
      expect(mockInsertOne).toBeCalledWith({ _id: 2, value: 5 }, {});
      expect(result).toEqual({ acknowledged: true });
    });
    it('it should be possible to insert many records', async () => {
      await connect();
      const result = await insertMany('test-collection-4', [
        { _id: 2, value: 5 },
        { _id: 3, value: 10 },
        { _id: 4, value: 12 },
      ]);
      expect(mockDb).toBeCalledWith(DEFAULT_MONGO_DB);
      expect(mockCollection).toBeCalledWith('test-collection-4');
      expect(mockInsertMany).toBeCalledWith([
        { _id: 2, value: 5 },
        { _id: 3, value: 10 },
        { _id: 4, value: 12 },
      ], {});
      expect(result).toEqual({ acknowledged: true });
    });
    it('it should be possible to replace a record', async () => {
      await connect();
      const result = await replaceOne('test-collection-5', { _id: 5, value: 21 });
      expect(mockDb).toBeCalledWith(DEFAULT_MONGO_DB);
      expect(mockCollection).toBeCalledWith('test-collection-5');
      expect(mockReplaceOne).toBeCalledWith(
        { _id: 5 }, { _id: 5, value: 21 }, { upsert: false },
      );
      expect(result).toEqual({ acknowledged: true });
    });
    it('it should be possible to update a record', async () => {
      await connect();
      const result = await updateOne('test-collection-6', { _id: 6 }, { $set: { value: 10 }});
      expect(mockDb).toBeCalledWith(DEFAULT_MONGO_DB);
      expect(mockCollection).toBeCalledWith('test-collection-6');
      expect(mockUpdateOne).toBeCalledWith({ _id: 6 }, { $set: { value: 10 }}, {});
      expect(result).toEqual({ acknowledged: true });
    });
    it('it should be possible to upsert a record', async () => {
      await connect();
      const result = await replaceOne('test-collection-7',
        { _id: 7, value: 45 }, { upsert: true },
      );
      expect(mockDb).toBeCalledWith(DEFAULT_MONGO_DB);
      expect(mockCollection).toBeCalledWith('test-collection-7');
      expect(mockReplaceOne).toBeCalledWith(
        { _id: 7 }, { _id: 7, value: 45 }, { upsert: true },
      );
      expect(result).toEqual({ acknowledged: true });
    });
    it('it should be possible to update many records', async () => {
      await connect();
      const result = await updateMany('test-collection-8',
        { value: { $gt: 5 }}, { $set: { value: 10 }});
      expect(mockDb).toBeCalledWith(DEFAULT_MONGO_DB);
      expect(mockCollection).toBeCalledWith('test-collection-8');
      expect(mockUpdateMany).toBeCalledWith(
        { value: { $gt: 5 }}, { $set: { value: 10 }}, { upsert: false },
      );
      expect(result).toEqual({ acknowledged: true });
    });
    it('it should be possible to delete a record', async () => {
      await connect();
      const result = await deleteOne('test-collection-9', { _id: 8 });
      expect(mockDb).toBeCalledWith(DEFAULT_MONGO_DB);
      expect(mockCollection).toBeCalledWith('test-collection-9');
      expect(mockDeleteOne).toBeCalledWith({ _id: 8 }, {});
      expect(result).toEqual({ acknowledged: true });
    });
    it('it should be possible to delete many records', async () => {
      await connect();
      const result = await deleteMany('test-collection-10', { value: { $gt: 11 }});
      expect(mockDb).toBeCalledWith(DEFAULT_MONGO_DB);
      expect(mockCollection).toBeCalledWith('test-collection-10');
      expect(mockDeleteMany).toBeCalledWith({ value: { $gt: 11 }}, {});
      expect(result).toEqual({ acknowledged: true });
    });
    it('it should be possible to execute an aggregation pipeline', async () => {
      await connect();
      const result = await aggregate('test-collection-11', [
        { $match: { $gt: 45 }},
        { $count: 'recordCount' },
      ]);
      expect(mockDb).toBeCalledWith(DEFAULT_MONGO_DB);
      expect(mockCollection).toBeCalledWith('test-collection-11');
      expect(mockAggregate).toBeCalledWith([
        { $match: { $gt: 45 }},
        { $count: 'recordCount' },
      ], {});
      expect(result).toEqual({ recordCount: 256 });
    });
    it('it should be possible to count with a specified filter', async () => {
      await connect();
      const result = await count('test-collection-12', { age: { $gt: 18 }});
      expect(mockDb).toBeCalledWith(DEFAULT_MONGO_DB);
      expect(mockCollection).toBeCalledWith('test-collection-12');
      expect(mockFind).toBeCalledWith({ age: { $gt: 18 }}, { _id: 1 }, {});
      expect(mockCount).toBeCalled();
      expect(result).toEqual(45);
    });
    it('it should be possible to start a connection session', async () => {
      await connect();
      startSession({ retryWrites: true });
      expect(mockStartSession).toHaveBeenCalledWith({ retryWrites: true });
    });
  });
});
