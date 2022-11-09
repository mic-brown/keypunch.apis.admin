import { Int32, ObjectId, Double, UUID } from 'bson';

const isObject = (val) => {
  return typeof(val) === 'object' && !(val instanceof Date);
};

const convertValue = (value) => {
  try {
    if (value === undefined || value === null) {
      return value;
    } else if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        value[i] = convertValue(value[i]);
      }
      return value;
    } else if (isObject(value)) {
      Object.keys(value).forEach((key) =>
        value[key] = convertValue(value[key]));
      return value;
    } else if (typeof value === 'boolean' || value instanceof Boolean) {
      return value;
    } else if (typeof value === 'string' || value instanceof String) {
      // eslint-disable-next-line max-len
      const dateMatch = /^([0-9]{4})[-]([0-9]{2})[-]([0-9]{2})[T]([0-9]{2}[:][0-9]{2}[:][0-9]{2}[.][0-9]+)?[Z]?$/gm
        .exec(value);
      if (dateMatch) {
        const [_match, year, month, day] = [...dateMatch];
        const d = new Date(value);

        if (!isNaN(d)
          && d.getUTCFullYear() === Number.parseInt(year, 10)
          && d.getUTCMonth() + 1 == Number.parseInt(month, 10)
          && d.getUTCDate() === Number.parseInt(day, 10)) {
          return d;
        }
      }
      if (/^[0-9a-fA-F]{24}$/gm.test(value)) {
        return new ObjectId(value);
      }
      // eslint-disable-next-line max-len
      if(/^(?:\{{0,1}(?:[0-9a-fA-F]){8}-(?:[0-9a-fA-F]){4}-(?:[0-9a-fA-F]){4}-(?:[0-9a-fA-F]){4}-(?:[0-9a-fA-F]){12}\}{0,1})$/gm
        .test(value)) {
        return new UUID(value);
      }
      return value;
    } else if(Number.isFinite(value) && Number.isInteger(value)) {
      return new Int32(value).value;
    } else if(Number.isFinite(value)) {
      return new Double(value).value;
    }
  } catch (error) {
    return value;
  }
  return value;
};

const mongoModelBinder = (req, _res, next) => {
  try {
    const { body } = req;
    if (body) {
      Object.keys(body).forEach((key) => {
        body[key] = convertValue(body[key]);
      });
    }
    next();
  } catch (error) {
    next(error);
  }
};

export default mongoModelBinder;
