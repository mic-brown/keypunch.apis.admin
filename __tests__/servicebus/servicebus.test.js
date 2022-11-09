const mockLogInfo = jest.fn();
const mockLogError = jest.fn();
jest.mock('../../src/logger', () => ({
  __esModule: true,
  info: mockLogInfo,
  error: mockLogError,
  default: {
    info: mockLogInfo,
    error: mockLogError,
  },
}));

jest.mock('../../src/settings', () => ({
  __esModule: true,
  BUS: {
    CONNECTION: 'BusConnectionString',
  },
  default: {
    BUS: {
      CONNECTION: 'BusConnectionString',
    },
  },
}));

const mockBatch = {
  tryAddMessage: jest.fn(() => true),
};
const mockCreateMessageBatch = jest.fn(() => Promise.resolve(mockBatch));
const mockSendMessages = jest.fn();
const mockCloseSender = jest.fn();

const mockSender = jest.fn(() => ({
  createMessageBatch: mockCreateMessageBatch,
  sendMessages: mockSendMessages,
  close: mockCloseSender,
}));

const mockClient = {
  close: jest.fn(() => Promise.resolve()),
  createSender: jest.fn(mockSender),
};

const mockServiceBus = ({
  delay: jest.fn(() => Promise.resolve()),
  ServiceBusClient: jest.fn(() => mockClient),
});

jest.doMock('@azure/service-bus', () => mockServiceBus);

const { default: {
  connect,
  close,
  sendMessages,
  sendMessage,
}} = require('../../src/servicebus');

describe('servicebus', () => {
  describe('connect', () => {
    it('it should be possible to to create an instance of the Azure Service Bus client',
      async () => {
        const client = await connect();
        expect(mockServiceBus.ServiceBusClient).toBeCalledWith('BusConnectionString');
        expect(client).toBe(mockClient);
        expect(mockLogInfo).toBeCalledWith('connected to service bus: "BusConnectionString"');
      });
  });
  describe('send messages', () => {
    beforeAll(async () => {
      await connect();
    });
    it('it should create an instance of a "sender"', async () => {
      await sendMessages([{ message: 'hello world' }], 'test-queue', { appProperty: 'app prop' });
      expect(mockClient.createSender).toBeCalledWith('test-queue');
    });
    it('it should create a message batch', async () => {
      await sendMessages([{ message: 'hello world' }], 'test-queue', { appProperty: 'app prop' });
      expect(mockCreateMessageBatch).toBeCalled();
    });
    it('it should add the messages to the message batch', async () => {
      await sendMessages([{ message: 'hello world' }], 'test-queue', { appProperty: 'app prop' });
      expect(mockBatch.tryAddMessage).toBeCalledWith({
        body: {
          message: 'hello world',
        },
        applicationProperties: {
          appProperty: 'app prop',
        },
      });
    });
    it('it should send the messages', async () => {
      await sendMessages([{ message: 'hello world' }], 'test-queue', { appProperty: 'app prop' });
      expect(mockSendMessages).toBeCalled();
    });
    it('it should close the sender', async () => {
      await sendMessages([{ message: 'hello world' }], 'test-queue', { appProperty: 'app prop' });
      expect(mockCloseSender).toBeCalled();
    });
    afterAll(async () => {
      await close();
    });
  });
  describe('send messaage', () => {
    beforeAll(async () => {
      await connect();
    });
    it('it should be possible to send a single message', async () => {
      await sendMessage({ message: 'hello world' }, 'test-queue', { appProperty: 'app prop' });
      expect(mockClient.createSender).toBeCalledWith('test-queue');
      expect(mockCreateMessageBatch).toBeCalled();
      expect(mockBatch.tryAddMessage).toBeCalledWith({
        body: {
          message: 'hello world',
        },
        applicationProperties: {
          appProperty: 'app prop',
        },
      });
      expect(mockSendMessages).toBeCalled();
      expect(mockCloseSender).toBeCalled();
    });
    afterAll(async () => {
      await close();
    });
  });
  describe('close', () => {
    beforeAll(async () => {
      await connect();
      await close();
    });
    it('it should be possible to close the connection', () => {
      expect(mockClient.close).toBeCalled();
    });
    it('it should delay closing to ensure all messages have been sent', () => {
      expect(mockServiceBus.delay).toBeCalledWith(5000);
    });
  });
});
