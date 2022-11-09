import errorResponses from '../errorResponses.json';

export default (_req, res, _next) => {
  res.status(404).send(errorResponses['404']);
};
