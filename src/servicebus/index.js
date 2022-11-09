import { delay, ServiceBusClient } from '@azure/service-bus';
import { BUS } from '../settings';
import logger from '../logger';

const state = {
  client: null,
};

export const connect = () => new Promise((resolve, reject) => {
  if(BUS?.CONNECTION) {
    try {
      state.client = new ServiceBusClient(BUS.CONNECTION );
      logger.info(`connected to service bus: "${BUS.CONNECTION}"`);
      resolve(state.client);
    } catch (error) {
      logger.error(error);
      reject(error);
    }
  } else {
    logger.info('no service bus configuration available');
    resolve();
  }
});

export const sendMessages = async (messages = [], queue, applicationProperties) => {
  const { client } = state;
  const sender = client.createSender(queue);

  let batch = await sender.createMessageBatch();
  for (let i = 0; i < messages.length; i++) {
    const message = {
      body:  messages[i],
      applicationProperties,
    };
    if(!batch.tryAddMessage(message)) {
      await sender.sendMessages(batch);
      batch = await sender.createMessageBatch();
      if (!batch.tryAddMessage(message)) {
        throw new Error('message too big to fit in batch');
      }
    }
  }
  await sender.sendMessages(batch);
  await sender.close();
};

export const sendMessage = async (message, queue, applicationProperties) => {
  sendMessages([message], queue, applicationProperties);
};

export const close = async () => {
  await delay(5000);
  await state?.client?.close();
  state.client = null;
};

export default {
  connect,
  close,
  sendMessage,
  sendMessages,
};
