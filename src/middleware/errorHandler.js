import { ObjectId } from 'mongodb';
import errorResponses from '../errorResponses.json';
import logger from '../logger';
import { sendMessage } from '../servicebus';
import { APPNAME } from '../settings';
import * as QUEUE from '../busQueues';

export default async (err, req, res, _next) => {
  try {
    const { user } = req;
    if (user?.accessToken) {
      const { accessToken, email } = user;
      let message = {
        _id: new ObjectId().toHexString(),
        application: APPNAME,
        email,
      };
      if (err instanceof Error) {
        const { name, message: errorMessage, stack } = err;
        message = {
          ...message,
          name,
          message: errorMessage,
          stack,
        };
      } else {
        message = {
          ...message,
          message: err,
        };
      }
      await sendMessage(message, QUEUE.EXCEPTIONS, accessToken);
    }
  } catch (error) {
    logger.error(error);
  }
  if (err?.status && errorResponses[err.status]) {
    const { status, code, inner } = err;
    res.status(status).send({
      ...errorResponses[status],
      code,
      ...(inner || {}),
    });
  } else {
    logger.error(err);
    res.status(500).send(errorResponses['500']);
  }
};
