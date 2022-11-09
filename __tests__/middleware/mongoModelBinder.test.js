jest.mock('../../src/logger', () => ({
  __esModule: true,
  error: jest.fn(),
  default: {
    error: jest.fn(),
  },
}));

import { ObjectID, UUID } from 'bson';
import mongoModelBinder from '../../src/middleware/mongoModelBinder';

describe('middleware.mongoModelBinder', () => {
  describe('when an object is posted', () => {
    it('it should be able to bind a string', () => {
      const req = {
        body: {
          value: 'a string',
        },
      };
      mongoModelBinder(req, {}, jest.fn());
      const { body: { value }} = req;
      expect(value).toEqual('a string');
    });
    it('it should be able to bind a boolean', () => {
      const req = {
        body: {
          value: true,
        },
      };
      mongoModelBinder(req, {}, jest.fn());
      const { body: { value }} = req;
      expect(value).toEqual(true);
    });
    it('it should be able to bind an integer', () => {
      const req = {
        body: {
          value: 42,
        },
      };
      mongoModelBinder(req, {}, jest.fn());
      const { body: { value }} = req;
      expect(value).toEqual(42);
    });
    it('it should be able to bind a double', () => {
      const req = {
        body: {
          value: 42.42,
        },
      };
      mongoModelBinder(req, {}, jest.fn());
      const { body: { value }} = req;
      expect(value).toEqual(42.42);
    });
    it('it should be able to bind a date', () => {
      const req = {
        body: {
          value: '2022-12-04T12:13:43.511Z',
        },
      };
      mongoModelBinder(req, {}, jest.fn());
      const { body: { value }} = req;
      expect(value).toBeInstanceOf(Date);
      expect(value.getUTCFullYear()).toEqual(2022);
      expect(value.getUTCMonth()).toEqual(11);
      expect(value.getUTCDate()).toEqual(4);
      expect(value.getUTCHours()).toEqual(12);
      expect(value.getUTCMinutes()).toEqual(13);
      expect(value.getUTCSeconds()).toEqual(43);
    });
    it('it should be able to bind a date in BST', () => {
      const req = {
        body: {
          value: '2022-09-04T12:13:43.511Z',
        },
      };
      mongoModelBinder(req, {}, jest.fn());
      const { body: { value }} = req;
      expect(value).toBeInstanceOf(Date);
      expect(value.getUTCFullYear()).toEqual(2022);
      expect(value.getUTCMonth()).toEqual(8);
      expect(value.getUTCDate()).toEqual(4);
      expect(value.getUTCHours()).toEqual(12);
      expect(value.getUTCMinutes()).toEqual(13);
      expect(value.getUTCSeconds()).toEqual(43);
    });
    it('it should be able to bind a GUID', () => {
      const req = {
        body: {
          value: 'a9e0ad21-c62a-4ce3-a30a-77116e153ea8',
        },
      };
      mongoModelBinder(req, {}, jest.fn());
      const { body: { value }} = req;
      expect(value).toEqual(new UUID('a9e0ad21-c62a-4ce3-a30a-77116e153ea8'));
      expect(value).toBeInstanceOf(UUID);
    });
    it('it should be able to bind an objectID', () => {
      const req = {
        body: {
          value: '6314a17bc2bde514b065bc07',
        },
      };
      mongoModelBinder(req, {}, jest.fn());
      const { body: { value }} = req;
      expect(value).toEqual(new ObjectID('6314a17bc2bde514b065bc07'));
      expect(value).toBeInstanceOf(ObjectID);
    });
    it('it should be able to bind values within an array', () => {
      const req = {
        body: {
          value: [
            'a string',
            43.3,
            '2022-12-04T12:13:43.511Z',
            'a9e0ad21-c62a-4ce3-a30a-77116e153ea8',
            '6314a17bc2bde514b065bc07',
            {
              anotherID: '63149bab057a3a1ceea50a54',
            },
          ],
        },
      };
      mongoModelBinder(req, {}, jest.fn());
      const { body: { value }} = req;
      expect(value).toEqual([
        'a string',
        43.3,
        new Date(2022, 11, 4, 12, 13, 43, 511),
        new UUID('a9e0ad21-c62a-4ce3-a30a-77116e153ea8'),
        new ObjectID('6314a17bc2bde514b065bc07'),
        {
          anotherID: new ObjectID('63149bab057a3a1ceea50a54'),
        },
      ]);
    });
    it('it should be able to handle null', () => {
      const req = {
        body: {
          value: null,
        },
      };
      mongoModelBinder(req, {}, jest.fn());
      const { body: { value }} = req;
      expect(value).toBeNull();
    });
    it('it should be able to handle undefined', () => {
      const req = {
        body: {
          value: undefined,
        },
      };
      mongoModelBinder(req, {}, jest.fn());
      const { body: { value }} = req;
      expect(value).toBeUndefined();
    });
    it('it should ignore unsupported types', () => {
      const value = Symbol('Some Symbol');
      const req = {
        body: {
          value,
        },
      };
      mongoModelBinder(req, {}, jest.fn());
      const { body: { value: v }} = req;
      expect(value).toBe(v);
    });
    it('it should call next when the binding is complete', () => {
      const req = {
        body: {
          value: true,
        },
      };
      const next = jest.fn();
      mongoModelBinder(req, {}, next);
      expect(next).toBeCalledWith();
    });
  });
  describe('when an array is posted', () => {
    it('it should be able to bind the values', () => {
      const req = {
        body: [
          'a string',
          43.3,
          '2022-12-04T12:13:43.511Z',
          'a9e0ad21-c62a-4ce3-a30a-77116e153ea8',
          '6314a17bc2bde514b065bc07',
          {
            anotherID: '63149bab057a3a1ceea50a54',
          },
        ],
      };
      mongoModelBinder(req, {}, jest.fn());
      const { body } = req;
      expect(body).toEqual([
        'a string',
        43.3,
        new Date(2022, 11, 4, 12, 13, 43, 511),
        new UUID('a9e0ad21-c62a-4ce3-a30a-77116e153ea8'),
        new ObjectID('6314a17bc2bde514b065bc07'),
        {
          anotherID: new ObjectID('63149bab057a3a1ceea50a54'),
        },
      ]);
    });
  });
  describe('when there is no body in tge request', () => {
    it('should do nothing and call next with no parameters', () => {
      const next = jest.fn();
      mongoModelBinder({}, {}, next);
      expect(next).toHaveBeenCalledWith();
    });
  });
  describe('error handling', () => {
    it('should call next with the error if the body cannot be understood', () => {
      const req = {
        body: 'foo',
      };
      const next = jest.fn();
      mongoModelBinder(req, {}, next);
      expect(next).toBeCalledWith(expect.any(Error));
    });
    it('should handle an invalid date string by leaving it as a string', () => {
      const req = {
        body: {
          value: '2022-02-29T12:13:43.511Z',
        },
      };
      mongoModelBinder(req, {}, jest.fn());
      const { body: { value }} = req;
      expect(value).toEqual('2022-02-29T12:13:43.511Z');
    });
  });
});
