import { Validator } from 'jsonschema';
import errorResponses from '../errorResponses.json';
import { rewriteHook as rewrite, preValidatePropertyHook as preValidateProperty } from '../schema';

const validateBody = (schema, dependantSchemas = []) => (callback) => async (req, res, next) => {

  try {
    if (schema) {

      const { body } = req;
      const validator = new Validator();

      if (dependantSchemas?.length) {
        dependantSchemas.forEach((s) => {
          const { id: uri } = s;
          validator.addSchema(s, uri);
        });
      }

      const validationResult = validator.validate(
        body,
        schema,
        {
          required: true,
          rewrite,
          preValidateProperty,
        },
      );

      const { valid, errors } = validationResult;

      if (!valid) {
        res.status(400).send({
          ...errorResponses[400],
          errors: errors.map(({ argument, property, message, name, path }) => ({
            argument,
            property,
            message,
            name,
            path,
          })),
        });
        return;
      }
    }
    await callback(req, res, next);
  } catch (error) {
    next(error);
  }
};

export default validateBody;
