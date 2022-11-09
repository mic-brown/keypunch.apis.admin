import { ObjectId, UUID, Int32, Double } from 'bson';

const rewriteHook = (instance, _schema) => {
  try {
    if (typeof(instance) !== 'undefined' || instance !== null) {
      if (typeof instance === 'string' || instance instanceof String) {
        // eslint-disable-next-line max-len
        const dateMatch = /^([0-9]{4})[-]([0-9]{2})[-]([0-9]{2})[T](([0-9]{2}[:][0-9]{2}[:][0-9]{2}[.]?[0-9]+)?[Z]?)|(([0-9]{2}):([0-9]{2}):([0-9]{2})(\+[0-9]{2}:[0-9]{2})?)$/gm
          .exec(instance);

        if (dateMatch) {
          const [_match, year, month, day] = [...dateMatch];
          const d = new Date(instance);

          if (!isNaN(d)
            && d.getUTCFullYear() === Number.parseInt(year, 10)
            && d.getUTCMonth() + 1 == Number.parseInt(month, 10)
            && d.getUTCDate() === Number.parseInt(day, 10)) {
            return d;
          }
        }

        // eslint-disable-next-line max-len
        if(/^(?:\{{0,1}(?:[0-9a-fA-F]){8}-(?:[0-9a-fA-F]){4}-(?:[0-9a-fA-F]){4}-(?:[0-9a-fA-F]){4}-(?:[0-9a-fA-F]){12}\}{0,1})$/gm
          .test(instance)) {
          return new UUID(instance);
        }

        if (/^[0-9a-fA-F]{24}$/gm.test(instance)) {
          return new ObjectId(instance);
        }
      } else if(Number.isFinite(instance) && Number.isInteger(instance)) {
        return new Int32(instance).value;
      } else if(Number.isFinite(instance)) {
        return new Double(instance).value;
      }
    }
    return instance;
  } catch (_e) {
    return instance;
  }
};

export default rewriteHook;
