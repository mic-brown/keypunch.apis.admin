import errorResponses from '../errorResponses.json';

const authorize = (roles = []) => (handler) => async (req, res, next) => {
  try {
    const { user: { hasRole, enabled }}= req;
    if (enabled && hasRole(...roles)) {
      await handler(req, res, next);
    } else {
      res.status(403).send(errorResponses[403]);
    }
  } catch (error) {
    next(error);
  }
};

export default authorize;
