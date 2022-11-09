import Express, { json } from 'express';
import Cors from 'cors';
import passport from 'passport';
import logger from './logger';
import bearerStrategy from './auth/bearerStrategy';
import { configureRoutes } from './routes';
import { errorHandler, mongoModelBinder, notFoundHandler } from './middleware';
import { CORS_WHITELIST } from './settings';

const app = Express();

app.use(json());

app.use(passport.initialize());
passport.use(bearerStrategy);

logger.info(`successfully configured passport with bearer strategy`);

const cors = Cors({
  origin: CORS_WHITELIST,
});
app.use(cors);
logger.info(`successfully configured CORS: ${CORS_WHITELIST}`);

app.use(mongoModelBinder);

configureRoutes(app, passport);

app.use(notFoundHandler);

app.use(errorHandler);

export default app;
