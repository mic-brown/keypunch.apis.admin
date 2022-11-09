import { ObjectID, UUID } from 'bson';

const preValidatePropertyHook = (object, key, _schema, _options, _ctx) => {
  const value = object[key];

  if (typeof value === 'undefined') return;

  if(value instanceof Date) {
    object[key] = value.toJSON();
    return;
  }
  if (value instanceof ObjectID) {
    object[key] = value.toHexString();
    return;
  }
  if(value instanceof UUID) {
    object[key] = value.toHexString();
    return;
  }
};

export default preValidatePropertyHook;
