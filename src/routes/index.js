import homeRoute from './homeRoute';

export const configureRoutes = (app) => {
  app.use('/', homeRoute);
};

export default { configureRoutes };
