import { ObjectID, UUID, Double, Int32 } from 'bson';
import { Validator } from 'jsonschema';
import rewrite from '../../src/schema/rewriteHook';

const validator = new Validator();

describe('schema.rewriteHook', () => {
  it('should be able to rewrite a BSON Object ID', () => {
    const doc = {
      _id: '608aedbb9c8201c3c0b8cb1b',
      firstName: 'John',
      lastName: 'Doe',
    };
    const { valid } = validator.validate(doc, {
      type: 'object',
      properties: {
        _id: {
          type: 'string',
        },
        firstName: {
          type: 'string',
        },
        lastName: {
          type: 'string',
        },
      },
      required: ['_id', 'firstName', 'lastName'],
    }, { rewrite });

    expect(valid).toBe(true);
    const { _id } = doc;
    expect(_id).toBeInstanceOf(ObjectID);
  });
  it('should be able to rewrite a BSON GUID', () => {
    const doc = {
      _id: 'eab7c57f-e8ab-4d5a-b75b-3efb731fab47',
      firstName: 'John',
      lastName: 'Doe',
    };
    const { valid } = validator.validate(doc, {
      type: 'object',
      properties: {
        _id: {
          type: 'string',
        },
        firstName: {
          type: 'string',
        },
        lastName: {
          type: 'string',
        },
      },
      required: ['_id', 'firstName', 'lastName'],
    }, { rewrite });

    expect(valid).toBe(true);
    const { _id } = doc;
    expect(_id).toBeInstanceOf(UUID);
  });
  it('should be able to rewrite a decimal', () => {
    const doc = {
      _id: '608aedbb9c8201c3c0b8cb1b',
      firstName: 'John',
      lastName: 'Doe',
      salary: 65.50,
    };
    const { valid } = validator.validate(doc, {
      type: 'object',
      properties: {
        _id: {
          type: 'string',
        },
        firstName: {
          type: 'string',
        },
        lastName: {
          type: 'string',
        },
        salary: {
          type: 'decimal',
        },
      },
      required: ['_id', 'firstName', 'lastName', 'salary'],
    }, { rewrite });

    expect(valid).toBe(true);
    const { salary } = doc;
    expect(salary).toEqual((new Double(65.5)).value);
  });
  it('should be able to rewrite an integer', () => {
    const doc = {
      _id: '608aedbb9c8201c3c0b8cb1b',
      firstName: 'John',
      lastName: 'Doe',
      age: 45,
    };
    const { valid } = validator.validate(doc, {
      type: 'object',
      properties: {
        _id: {
          type: 'string',
        },
        firstName: {
          type: 'string',
        },
        lastName: {
          type: 'string',
        },
        age: {
          type: 'integer',
        },
      },
      required: ['_id', 'firstName', 'lastName', 'age'],
    }, { rewrite });

    expect(valid).toBe(true);
    const { age } = doc;
    expect(age).toEqual((new Int32(45)).value);
  });
  it('should be able to rewrite a date time', () => {
    const doc = {
      _id: '608aedbb9c8201c3c0b8cb1b',
      firstName: 'John',
      lastName: 'Doe',
      dob: '2006-01-02T15:04:05.000Z',
      dod: '2056-10-24T17:03:24+00:00',
    };
    const { valid } = validator.validate(doc, {
      type: 'object',
      properties: {
        _id: {
          type: 'string',
        },
        firstName: {
          type: 'string',
        },
        lastName: {
          type: 'string',
        },
        dob: {
          type: 'string',
        },
        dod: {
          type: 'string',
        },
      },
      required: ['_id', 'firstName', 'lastName', 'dob'],
    }, { rewrite });

    expect(valid).toBe(true);
    const { dob, dod } = doc;
    expect(dob).toBeInstanceOf(Date);
    expect(dob).toEqual(new Date(2006, 0, 2, 15, 4, 5));
    expect(dod).toBeInstanceOf(Date);
    expect(dod).toEqual(new Date(Date.UTC(2056, 9, 24, 17, 3, 24)));
  });
});
