const { ObjectId } = require('mongodb');
const mockLogInfo = jest.fn();
const mockLogError = jest.fn();
const mockSendChunked = jest.fn();
const mockFindOne = jest.fn((_collection, { _id: id }) =>
  id?.toString() === '608aedbb9c8201c3c0b8cb1b'
    ? { _id: 1, name: 'Sylvester Stallone', version: 1 }
    : null,
);
const mockUpdateOne = jest.fn((_collection, { _id: id }) => ({
  modifiedCount: id?.toString() === '608aedbb9c8201c3c0b8cb1b'
    ? 1
    : 0,
}));
const mockReplaceOne = jest.fn((_collection, { _id: id, version }) => {
  if (id?.toString() === '608aedbb9c8201c3c0b8cb1b') {
    return {
      matchedCount: 1,
      modifiedCount: version === 1 ? 1 : 0,
    };
  }
  return { matchedCount: 0, modifiedCount: 1 };
});
const mockInsertOne = jest.fn();
const mockCursor = {};
const mockSort = jest.fn(() => mockCursor);
mockCursor.sort = mockSort;
const mockFind = jest.fn(() => mockCursor);
const mockWithTransaction = jest.fn(async (callback) => await callback());
const mockEndSession = jest.fn();
const mockSession = {
  withTransaction: mockWithTransaction,
  endSession: mockEndSession,
};
const mockStartSession = jest.fn(() => mockSession);
jest.mock('../../src/logger', () => ({
  __esModule: true,
  info: mockLogInfo,
  error: mockLogError,
  default: {
    info: mockLogInfo,
    error: mockLogError,
  },
}));

jest.mock('../../src/controllers/helpers', () => ({
  __esModule: true,
  sendChunked: mockSendChunked,
  default: {
    sendChunked: mockSendChunked,
  },
}));
jest.mock('../../src/db', () => ({
  __esModule: true,
  findOne: mockFindOne,
  find: mockFind,
  updateOne: mockUpdateOne,
  replaceOne: mockReplaceOne,
  insertOne: mockInsertOne,
  startSession: mockStartSession,
  default: {
    findOne: mockFindOne,
    find: mockFind,
    updateOne: mockUpdateOne,
    replaceOne: mockReplaceOne,
    insertOne: mockInsertOne,
    startSession: mockStartSession,
  },
}));

const { default: ControllerBase } = require('../../src/controllers/controllerbase');

class TestController extends ControllerBase {
  constructor() {
    super('collection-name', 'audit-collection-name', { email: 1 });
  }
}

describe('controllerbase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('it should set the collection property', () => {
    const { collection } = new TestController();
    expect(collection).toEqual('collection-name');
  });
  it('it should set the audit collection property', () => {
    const { auditCollection } = new TestController();
    expect(auditCollection).toEqual('audit-collection-name');
  });
  it('it should set the default sort property', () => {
    const { defaultSort } = new TestController();
    expect(defaultSort).toEqual({ email: 1 });
  });
  describe('get', () => {
    it('it should create a function do get a single record', () => {
      const { getEntity } = new TestController();
      expect(getEntity).toBeInstanceOf(Function);
    });
    it('it should be be possible to find a single record with a valid ID', async () => {
      const req = { params: { id: '608aedbb9c8201c3c0b8cb1b' }};
      const res = {};
      res.status = jest.fn(() => res);
      res.send = jest.fn();
      const { getEntity } = new TestController();
      await getEntity(req, res, jest.fn());
      expect(mockFindOne).toBeCalledWith('collection-name', {
        _id: expect.any(ObjectId),
        $or: [
          { deleted: false },
          { deleted: { $exists: false }},
        ],
      });
      expect(res.status).toBeCalledWith(200);
      expect(res.send).toBeCalledWith({ _id: 1, name: 'Sylvester Stallone', version: 1 });
    });
    it('it should send a 404 if there is no matching record', async () => {
      const req = { params: { id: '608aedbb9c8201c3c0b8cb1c' }};
      const res = {};
      res.status = jest.fn(() => res);
      res.send = jest.fn();
      const { getEntity } = new TestController();
      await getEntity(req, res, jest.fn());
      expect(mockFindOne).toBeCalledWith('collection-name', {
        _id: expect.any(ObjectId),
        $or: [
          { deleted: false },
          { deleted: { $exists: false }},
        ],
      });
      expect(res.status).toBeCalledWith(404);
      expect(res.send).toBeCalledWith({ status: 404, statusText: '404 Not Found' });
    });
  });
  describe('getAll', () => {
    it('it should create a function do get all records', () => {
      const { getAllEntities } = new TestController();
      expect(getAllEntities).toBeInstanceOf(Function);
    });
    it('it should send all records', async () => {
      const res = {};
      res.status = jest.fn(() => res);
      res.send = jest.fn();
      const { getAllEntities } = new TestController();
      await getAllEntities({}, res, jest.fn());
      expect(mockFind).toHaveBeenCalledWith('collection-name', {
        $or: [
          { deleted: false },
          { deleted: { $exists: false }},
        ],
      });
      expect(mockSort).toBeCalledWith({ email: 1 });
      expect(mockSendChunked).toBeCalledWith(mockCursor, res);
    });
  });
  describe('post', () => {
    it('it should create a function to post a new record', () => {
      const { postEntity } = new TestController();
      expect(postEntity).toBeInstanceOf(Function);
    });
    it('it should be possible to post a new record', async () => {
      const req = {
        body: {
          firstName: 'John',
          lastName: 'Doe',
        },
        user: {
          email: 'user@email.com',
        },
      };
      const res = { };
      res.send = jest.fn();
      res.status = jest.fn (() => res);
      const { postEntity } = new TestController();
      await postEntity(req, res);
      expect(mockStartSession).toBeCalledTimes(1);
      expect(mockInsertOne).toBeCalledTimes(2);
      expect(mockInsertOne).toBeCalledWith('collection-name', {
        _id: expect.any(ObjectId),
        version: 1,
        firstName: 'John',
        lastName: 'Doe',
      }, { session: mockSession });
      expect(mockInsertOne).toBeCalledWith(
        'audit-collection-name',
        {
          _id: expect.any(ObjectId),
          dateTime: expect.any(Date),
          state: {
            _id: expect.any(ObjectId),
            version: 1,
            firstName: 'John',
            lastName: 'Doe',
          },
          operation: 'POST',
          user: 'user@email.com',
        },
        { session: mockSession },
      );
      expect(mockEndSession).toBeCalledTimes(1);
      expect(res.status).toBeCalledWith(201);
      expect(res.send).toBeCalledWith({
        _id: expect.any(ObjectId),
        version: 1,
        firstName: 'John',
        lastName: 'Doe',
      });
    });
  });
  describe('put', () => {
    it('it should create a function to update a record', () => {
      const { putEntity } = new TestController();
      expect(putEntity).toBeInstanceOf(Function);
    });
    it('is should send a 400 if the entity of the ID doesn\'t match that in the URL', async () => {
      const req = {
        params: {
          id: '608aedbb9c8201c3c0b8cb1e',
        },
        body: {
          _id: new ObjectId('608aedbb9c8201c3c0b8cb1b'),
        },
        user: {
          email: 'user@email.com',
        },
      };
      const res = { };
      const mockSend = jest.fn();
      const mockStatus = jest.fn(() => res);
      res.status = mockStatus;
      res.send = mockSend;
      const { putEntity } = new TestController();
      await putEntity(req, res);
      expect(mockStatus).toBeCalledTimes(1);
      expect(mockStatus).toBeCalledWith(400);
      expect(mockSend).toBeCalledTimes(1);
      expect(mockSend).toBeCalledWith({ status: 400, statusText: '400 Bad Request' });
    });
    it('it should be possible to update a record', async () => {
      const req = {
        params: {
          id: '608aedbb9c8201c3c0b8cb1b',
        },
        body: {
          _id: new ObjectId('608aedbb9c8201c3c0b8cb1b'),
          version: 1,
          firstName: 'Jane',
          lastName: 'Doe',
        },
        user: {
          email: 'user@email.com',
        },
      };
      const res = { };
      const mockSend = jest.fn();
      const mockStatus = jest.fn(() => res);
      res.status = mockStatus;
      res.send = mockSend;
      const { putEntity } = new TestController();
      await putEntity(req, res);
      expect(mockWithTransaction).toBeCalledTimes(1);
      expect(mockReplaceOne).toBeCalledWith(
        'collection-name',
        {
          _id: new ObjectId('608aedbb9c8201c3c0b8cb1b'),
          version: 1,
          $or: [
            { deleted: false },
            { deleted: { $exists: false }},
          ],
        },
        {
          _id: new ObjectId('608aedbb9c8201c3c0b8cb1b'),
          version: 2,
          firstName: 'Jane',
          lastName: 'Doe',
        },
        {
          session: mockSession,
        },
      );
      expect(mockInsertOne).toBeCalledWith(
        'audit-collection-name',
        {
          _id: expect.any(ObjectId),
          user: 'user@email.com',
          dateTime: expect.any(Date),
          operation: 'PUT',
          state: {
            _id: new ObjectId('608aedbb9c8201c3c0b8cb1b'),
            version: 1,
            firstName: 'Jane',
            lastName: 'Doe',
          },
        },
        {
          session: mockSession,
        },
      );
      expect(mockStatus).toBeCalledTimes(1);
      expect(mockStatus).toBeCalledWith(200);
      expect(mockSend).toBeCalledTimes(1);
      expect(mockSend).toBeCalledWith({
        status: 200,
        statusText: 'Success',
        entity: {
          _id: new ObjectId('608aedbb9c8201c3c0b8cb1b'),
          version: 2,
          firstName: 'Jane',
          lastName: 'Doe',
        },
      });
      expect(mockEndSession).toBeCalledTimes(1);
    });
    it('it should return a 404 if there is no matching record to update', async () => {
      const req = {
        params: {
          id: '608aedbb9c8201c3c0b8cb1e',
        },
        body: {
          _id: new ObjectId('608aedbb9c8201c3c0b8cb1e'),
          version: 1,
          firstName: 'Jane',
          lastName: 'Doe',
        },
        user: {
          email: 'user@email.com',
        },
      };
      const res = { };
      const mockSend = jest.fn();
      const mockStatus = jest.fn(() => res);
      res.status = mockStatus;
      res.send = mockSend;
      const { putEntity } = new TestController();
      await putEntity(req, res);
      expect(mockStatus).toBeCalledTimes(1);
      expect(mockStatus).toBeCalledWith(404);
      expect(mockSend).toBeCalledTimes(1);
      expect(mockSend).toBeCalledWith({ status: 404, statusText: '404 Not Found' });
    });
  });
  describe('patch', () => {
    it('it should create a function to patch a new record', () => {
      const { patchEntity } = new TestController();
      expect(patchEntity).toBeInstanceOf(Function);
    });
    it('it should be possible to patch a record', async () => {
      const req = {
        params: {
          id: '608aedbb9c8201c3c0b8cb1b',
        },
        body: [
          { op: 'test', path: '/version', value: 1 },
          { op: 'add', path: '/dob', value: '1946-07-06T00:00:00' },
        ],
        user: {
          email: 'user@email.com',
        },
      };
      const res = { };
      const mockSend = jest.fn();
      const mockStatus = jest.fn(() => res);
      res.status = mockStatus;
      res.send = mockSend;

      const { patchEntity } = new TestController();
      await patchEntity(req, res);

      expect(mockStartSession).toBeCalledTimes(1);
      expect(mockReplaceOne).toBeCalledWith(
        'collection-name',
        {
          _id: 1,
          dob: '1946-07-06T00:00:00',
          name: 'Sylvester Stallone',
          version: 2,
        },
        { session: mockSession },
      );
      expect(mockEndSession).toBeCalledTimes(1);
      expect(mockStatus).toBeCalledTimes(1);
      expect(mockStatus).toBeCalledWith(200);
      expect(mockSend).toBeCalledTimes(1);
      expect(mockSend).toBeCalledWith({
        status: 200,
        statusText: 'Success',
        entity: {
          _id: 1,
          dob: '1946-07-06T00:00:00',
          name: 'Sylvester Stallone',
          version: 2,
        },
      });
    });
    it('it should return a 404 if there is no matching record', async () => {
      const req = {
        params: {
          id: '608aedbb9c8201c3c0b8cb1e',
        },
        body: [
          { op: 'test', path: '/version', value: 0 },
          { op: 'add', path: '/dob', value: '1946-07-06T00:00:00' },
        ],
        user: {
          email: 'user@email.com',
        },
      };
      const res = { };
      const mockSend = jest.fn();
      const mockStatus = jest.fn(() => res);
      res.status = mockStatus;
      res.send = mockSend;

      const { patchEntity } = new TestController();
      await patchEntity(req, res);

      expect(mockStartSession).not.toBeCalled();
      expect(mockEndSession).not.toBeCalled();
      expect(mockStatus).toBeCalledTimes(1);
      expect(mockStatus).toBeCalledWith(404),
      expect(mockSend).toBeCalledTimes(1);
      expect(mockSend).toBeCalledWith({
        status: 404,
        statusText: '404 Not Found',
      });
    });
    it('it should return a 409 conflict if the version test fails', async () => {
      const req = {
        params: {
          id: '608aedbb9c8201c3c0b8cb1b',
        },
        body: [
          { op: 'test', path: '/version', value: 0 },
          { op: 'add', path: '/dob', value: '1946-07-06T00:00:00' },
        ],
        user: {
          email: 'user@email.com',
        },
      };
      const res = { };
      const mockSend = jest.fn();
      const mockStatus = jest.fn(() => res);
      res.status = mockStatus;
      res.send = mockSend;

      const { patchEntity } = new TestController();
      await patchEntity(req, res);

      expect(mockStartSession).not.toBeCalled();
      expect(mockEndSession).not.toBeCalled();
      expect(mockStatus).toBeCalledTimes(1);
      expect(mockStatus).toBeCalledWith(409),
      expect(mockSend).toBeCalledTimes(1);
      expect(mockSend).toBeCalledWith({
        status: 409,
        statusText: '409 Conflict',
      });
    });
    it('it should return a 400 for an invalid patch', async () => {
      const req = {
        params: {
          id: '608aedbb9c8201c3c0b8cb1b',
        },
        body: [
          { op: 'invaid', path: '/path', value: '1946-07-06T00:00:00' },
        ],
        user: {
          email: 'user@email.com',
        },
      };
      const res = { };
      const mockSend = jest.fn();
      const mockStatus = jest.fn(() => res);
      res.status = mockStatus;
      res.send = mockSend;

      const { patchEntity } = new TestController();
      await patchEntity(req, res);

      expect(mockStartSession).not.toBeCalled();
      expect(mockEndSession).not.toBeCalled();
      expect(mockStatus).toBeCalledTimes(1);
      expect(mockStatus).toBeCalledWith(400);
      expect(mockSend).toBeCalledTimes(1);
      expect(mockSend).toBeCalledWith({
        status: 400,
        statusText: '400 Bad Request',
      });
    });
  });
  describe('delete', () => {
    it('it should create a function to delete a new record', () => {
      const { deleteEntity } = new TestController();
      expect(deleteEntity).toBeInstanceOf(Function);
    });
    it('it should be possible to mark a record as deleted', async () => {
      const req = {
        params: {
          id: '608aedbb9c8201c3c0b8cb1b',
        },
        user: {
          email: 'user@email.com',
        },
      };
      const res = { };
      const mockSendStatus = jest.fn();
      res.sendStatus = mockSendStatus;

      const { deleteEntity } = new TestController();
      await deleteEntity(req, res);

      expect(mockStartSession).toBeCalledTimes(1);
      expect(mockUpdateOne).toBeCalledTimes(1);
      expect(mockUpdateOne).toBeCalledWith(
        'collection-name',
        {
          _id: new ObjectId('608aedbb9c8201c3c0b8cb1b'),
          $or: [
            { deleted: false },
            { deleted: { $exists: false }},
          ],
        },
        { $set: { deleted: true }},
        { session: mockSession },
      );
      expect(mockInsertOne).toBeCalledTimes(1);
      expect(mockInsertOne).toBeCalledWith(
        'audit-collection-name',
        {
          _id: expect.any(ObjectId),
          dateTime: expect.any(Date),
          operation: 'DELETE',
          user: 'user@email.com',
          state: null,
        },
        { session: mockSession },
      );
      expect(mockEndSession).toBeCalledTimes(1);
      expect(mockSendStatus).toBeCalledWith(204);
    });
    it('it should return a 404 if there is no record to update', async () => {
      const req = {
        params: {
          id: '608aedbb9c8201c3c0b8cb1f',
        },
        user: {
          email: 'user@email.com',
        },
      };
      const res = { };
      const mockSend = jest.fn();
      const mockStatus = jest.fn(() => res);
      res.status = mockStatus;
      res.send = mockSend;

      const { deleteEntity } = new TestController();
      await deleteEntity(req, res);

      expect(mockStartSession).toBeCalledTimes(1);
      expect(mockUpdateOne).toBeCalledTimes(1);
      expect(mockUpdateOne).toBeCalledWith(
        'collection-name',
        {
          _id: new ObjectId('608aedbb9c8201c3c0b8cb1f'),
          $or: [
            { deleted: false },
            { deleted: { $exists: false }},
          ],
        },
        { $set: { deleted: true }},
        { session: mockSession },
      );
      expect(mockInsertOne).not.toBeCalled();
      expect(mockEndSession).toBeCalledTimes(1);
      expect(mockStatus).toBeCalledWith(404);
      expect(mockSend).toBeCalledWith({
        status: 404,
        statusText: '404 Not Found',
      });
    });
  });
});
