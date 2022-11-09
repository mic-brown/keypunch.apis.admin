import { ObjectID, UUID } from 'bson';
import { Validator } from 'jsonschema';
import preValidateProperty from '../../src/schema/preValidatePropertyHook';

const validator = new Validator();

describe('schema.preValidatePropertyHook', () => {
  it('it should be able to convert a date for schema validation', () => {
    const doc = {
      _id: '608aedbb9c8201c3c0b8cb1b',
      firstName: 'John',
      lastName: 'Doe',
      dob: new Date(1978, 10, 20),
    };
    const result = validator.validate(doc, {
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
          format: 'date-time',
        },
      },
      required: ['_id', 'firstName', 'lastName', 'dob'],
    }, { preValidateProperty });

    const { valid } = result;
    expect(valid).toBe(true);

    const { dob } = doc;
    expect(typeof dob).toBe('string');
  });
  it('it should be able to convert a mongo Object ID for schema validation', () => {
    const doc = {
      _id: new ObjectID('608aedbb9c8201c3c0b8cb1b'),
      firstName: 'John',
      lastName: 'Doe',
    };
    const result = validator.validate(doc, {
      type: 'object',
      properties: {
        _id: {
          type: 'string',
          pattern: '^[0-9a-fA-F]{24}$',
        },
        firstName: {
          type: 'string',
        },
        lastName: {
          type: 'string',
        },
      },
      required: ['_id', 'firstName', 'lastName'],
    }, { preValidateProperty });

    const { valid } = result;
    expect(valid).toBe(true);

    const { _id } = doc;
    expect(typeof _id).toBe('string');
  });
  it('it should be able to convert a mongo UUID for schema validation', () => {
    const doc = {
      _id: new UUID('8b3cf894-0321-441f-83e5-a49a7f5fb6ed'),
      firstName: 'John',
      lastName: 'Doe',
      dob: new Date(1978, 10, 20),
    };

    const result = validator.validate(doc, {
      type: 'object',
      properties: {
        _id: {
          type: 'string',
          // eslint-disable-next-line max-len
          pattern: '^(?:{{0,1}(?:[0-9a-fA-F]){8}-(?:[0-9a-fA-F]){4}-(?:[0-9a-fA-F]){4}-(?:[0-9a-fA-F]){4}-(?:[0-9a-fA-F]){12}}{0,1})$',
        },
        firstName: {
          type: 'string',
        },
        lastName: {
          type: 'string',
        },
      },
      required: ['_id', 'firstName', 'lastName'],
    }, { preValidateProperty });

    const { valid } = result;
    expect(valid).toBe(true);

    const { _id } = doc;
    expect(typeof _id).toBe('string');
  });
});
