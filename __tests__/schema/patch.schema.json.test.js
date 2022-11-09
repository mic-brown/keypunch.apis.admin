import { Validator } from 'jsonschema';
const schema = require('../../src/schema/patch.schema.json');

const validator = new Validator();

describe('schema.patch', () => {
  it('it should validate an add operation', () => {
    const operation = {
      op: 'add',
      path: '/biscuits/1',
      value: {
        name: 'Ginger Nut',
      },
    };
    const result = validator.validate([operation], schema, { nestedErrors: true });
    const { valid } = result;
    expect(valid).toBe(true);
  });
  it('it should validate an remove operation', () => {
    const operation = {
      op: 'remove',
      path: '/biscuits',
    };
    const result = validator.validate([operation], schema, { nestedErrors: true });
    const { valid } = result;
    expect(valid).toBe(true);
  });
  it('it should validate a replace operation', () => {
    const operation = {
      op: 'replace',
      path: '/biscuits/0/name',
      value: 'Chocolate Digestive',
    };
    const result = validator.validate([operation], schema, { nestedErrors: true });
    const { valid } = result;
    expect(valid).toBe(true);
  });
  it('it should validate a copy operation', () => {
    const operation = {
      op: 'copy',
      from: '/biscuits/0',
      path: '/best_biscuit',
    };
    const result = validator.validate([operation], schema, { nestedErrors: true });
    const { valid } = result;
    expect(valid).toBe(true);
  });
  it('it should validate a move operation', () => {
    const operation = {
      op: 'move',
      from: '/biscuits',
      path: '/cookies',
    };
    const result = validator.validate([operation], schema, { nestedErrors: true });
    const { valid } = result;
    expect(valid).toBe(true);
  });
  it('it should validate a test operation', () => {
    const operation = {
      op: 'test',
      path: '/best_biscuit/name',
      value: 'Choco Leibniz',
    };
    const result = validator.validate([operation], schema, { nestedErrors: true });
    const { valid } = result;
    expect(valid).toBe(true);
  });
});
