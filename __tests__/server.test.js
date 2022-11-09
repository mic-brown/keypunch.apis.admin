const mockProcessExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
const mockProcessOnce = jest.spyOn(process, 'once').mockImplementation(() => {});

const httpServer = {
  on: jest.fn(),
  listen: jest.fn(),
  address: jest.fn(() => ({ port: 5001 })),
  close: jest.fn(),
};
const http = {
  createServer: jest.fn(() => httpServer),
};
jest.doMock('http', () => http);

jest.mock('../src/settings', () => ({
  __esModule: true,
  PORT: 5001,
  default: {
    PORT: 5001,
  },
}));

const mockLogInfo = jest.fn();
const mockLogError = jest.fn();

jest.mock('../src/logger', () => ({
  __esModule: true,
  info: mockLogInfo,
  error: mockLogError,
  default: {
    info: mockLogInfo,
    error: mockLogError,
  },
}));

jest.mock('../src/app', () => ({
  __esModule: true,
  default: {
    expressApp: true,
  },
}));

const mockConnectToDb = jest.fn(() => Promise.resolve());
const mockCloseDb = jest.fn(() => Promise.resolve());
jest.mock('../src/db', () => ({
  __esModule: true,
  connect: mockConnectToDb,
  close: mockCloseDb,
  default: {
    connect: mockConnectToDb,
    close: mockCloseDb,
  },
}));
const mockConnectToBus = jest.fn(() => Promise.resolve());
const mockCloseBus = jest.fn(() => Promise.resolve());
jest.mock('../src/servicebus', () => ({
  __esModule: true,
  connect: mockConnectToBus,
  close: mockCloseBus,
  default: {
    connect: mockConnectToBus,
    close: mockCloseBus,
  },
}));

const flushPromises = () => new Promise(setImmediate);
const { onListening, onClose, onError } = require('../src/server');

describe('server', () => {
  it('it should create an instance of an http server using the express app', async () => {
    await flushPromises();
    expect(http.createServer).toBeCalledWith({ expressApp: true });
  });
  it('it should create a connection to the database', () => {
    expect(mockConnectToDb).toBeCalledTimes(1);
  });
  it('it should create a connection to the bus', () => {
    expect(mockConnectToBus).toBeCalledTimes(1);
  });
  it('it should listen on the configured port', async () => {
    await flushPromises();
    expect(httpServer.listen).toBeCalledWith(5001);
  });
  describe('event handlers', () => {
    describe('onListening', () => {
      it('it should create a listening handler', async () => {
        await flushPromises();
        expect(httpServer.on).toBeCalledWith('listening', onListening);
      });
      it('it should log that server is listening', () => {
        onListening();
        expect(mockLogInfo).toBeCalledWith('listening on port 5001');
      });
    });
    describe('onClose', () => {
      it('it should create a close handler', async () => {
        await flushPromises();
        expect(httpServer.on).toBeCalledWith('close', onClose);
      });
      it('it should log that the application is closing', async () => {
        await onClose();
        await flushPromises();
        expect(mockLogInfo).toBeCalledWith('application closing');
      });
      it('it should close the connection the the database', async () => {
        await onClose();
        await flushPromises();
        expect(mockCloseDb).toBeCalled();
      });
    });
    describe('onError', () => {
      it('it should create an error handler', async () => {
        await flushPromises();
        expect(httpServer.on).toBeCalledWith('error', onError);
      });
      it('it should throw the error if not related to attempt to listen', () => {
        expect(() => onError({ code: 'CODE', syscall: 'not-listen' })).toThrow();
      });
      it('it should log and exit the process if elevated privileges are required', () => {
        onError({ code: 'EACCES', syscall: 'listen' });
        expect(mockLogError).toBeCalledWith('port 5001 requires elevated privileges');
        expect(mockProcessExit).toBeCalledWith(1);
      });
      it(`it should log and exit the process
        if elevated privileges if the configured port is in use`, () => {
        onError({ code: 'EADDRINUSE', syscall: 'listen' });
        expect(mockLogError).toBeCalledWith('port 5001 is already in use');
        expect(mockProcessExit).toBeCalledWith(1);
      });
      it('it shold throw any other listening errors', () => {
        expect(() => onError({ code: 'ANOTHERCODE', syscall: 'listen' })).toThrow();
      });
    });
  });
  /* it(`it should close the database, server and bus when a
    SIGUSR2 is signalled (nodemon)`, async () => {
    const [ [_signal, handler] ] = mockProcessOnce.mock.calls;
    handler();
    await flushPromises();
    expect(mockCloseDb).toBeCalled();
    expect(mockCloseBus).toBeCalled();
    expect(httpServer.close).toBeCalled();
  }); */

  afterEach(() => {
    mockLogInfo.mockClear();
    mockLogError.mockClear();
  });
  afterAll(() => {
    mockProcessExit.mockRestore();
    mockProcessOnce.mockRestore();
  });
});
