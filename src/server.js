import { createServer } from 'http';
import logger from './logger';
import { PORT } from './settings';
import app from './app';
import { connect as connectToDb, close as closeDb } from './db';
import { connect as connectToBus, close as closeBus } from './servicebus';

const server = createServer(app);
const bind = `port ${PORT}`;

export const onError = (error) => {
  const { code, syscall } = error;
  if (syscall !== 'listen') {
    throw error;
  }

  let exitCode = 0;

  switch (code) {
  case 'EACCES':
    logger.error(`${bind} requires elevated privileges`);
    exitCode = 1;
    break;
  case 'EADDRINUSE':
    logger.error(`${bind} is already in use`);
    exitCode = 1;
    break;
  default:
    break;
  }

  if (exitCode) {
    process.exit(exitCode);
  } else {
    throw error;
  }
};

export const onListening = () => {
  logger.info(`listening on ${bind}`);
};

export const onClose = () => new Promise((resolve, reject) => {
  logger.info('application closing');
  closeBus()
    .then(() => closeDb())
    .then(() => resolve())
    .catch((e) => reject(e));
});

server.on('listening', onListening);
server.on('close', onClose);
server.on('error', onError);

connectToDb()
  .then(connectToBus)
  .then(() => {
    server.listen(PORT);
    // eslint-disable-next-line no-constant-condition
    if (process.env.NODE_ENV === 'dev') {
      process.once('SIGUSR2',
        () => closeBus()
          .then(() => closeDb())
          .then(() => server.close())
          .finally(() => {
            process.kill(process.pid, 'SIGUSR2');
          }),
      );
    }
  })
  .catch((error) => logger.error(error));
