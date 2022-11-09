jest.mock('../../src/settings', () => ({
  __esModule: true,
  APPNAME: 'application-name',
  default: {
    APPNAME: 'application-name',
  },
}));

jest.mock('../../src/busQueues', () => ({
  __esModule: true,
  EXCEPTIONS: 'exceptions',
}));

const mockSendMessage = jest.fn();
jest.mock('../../src/servicebus', () => ({
  __esModule: true,
  sendMessage: mockSendMessage,
  default: {
    sendMessage: mockSendMessage,
  },
}));

jest.mock('../../src/logger', () => ({
  __esModule: true,
  error: jest.fn(),
  default: {
    error: jest.fn(),
  },
}));

const { default: HttpError } = require('../../src/httpError');
const { default: errorHandler } = require('../../src/middleware/errorHandler');

describe('middleware.errorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSendMessage.mockImplementation(() => Promise.resolve());
  });
  describe('where there is no specific status code on the error', () => {
    it('it should send a 500 status code', async () => {
      const res = {};
      res.send = jest.fn(() => res);
      res.status = jest.fn(() => res);
      await errorHandler('some error', {}, res, jest.fn());
      expect(res.status).toBeCalledWith(500);
    });
    it('it should send a 500 error response', async () => {
      const res = {};
      res.send = jest.fn(() => res);
      res.status = jest.fn(() => res);
      const next = jest.fn();
      await errorHandler('some error', {}, res, next);
      expect(res.send).toHaveBeenCalledWith({
        status: 500,
        statusText: '500 Internal Server Error',
      });
    });
    it('it should send the error the message bus if an access token is available', async () => {
      const req = {
        user: {
          accessToken: 'access-token',
          email: 'john.doe@email.com',
        },
      };
      const res = {};
      res.send = jest.fn(() => res);
      res.status = jest.fn(() => res);
      const next = jest.fn();
      await errorHandler('some error', req, res, next);
      expect(mockSendMessage).toBeCalledWith({
        _id: expect.any(String),
        message: 'some error',
        application: 'application-name',
        email: 'john.doe@email.com',
      }, 'exceptions', 'access-token');
      expect(res.send).toHaveBeenCalledWith({
        status: 500,
        statusText: '500 Internal Server Error',
      });
    });
    it('it should end the request', async () => {
      const res = {};
      res.send = jest.fn(() => res);
      res.status = jest.fn(() => res);
      const next = jest.fn();
      await errorHandler('some error', {}, res, next);
      expect(next).not.toBeCalled();
    });
  });
  describe('where the error has a specific status code', () => {
    it('should send the status code as described on the error', async () => {
      const error = new HttpError(401, 'an error occurred');
      const res = {};
      res.send = jest.fn(() => res);
      res.status = jest.fn(() => res);
      await errorHandler(error, {}, res, jest.fn());
      expect(res.status).toBeCalledWith(401);
    });
    it('should send a response appropriate to that error code', async () => {
      const error = new HttpError(418, 'an error occurred');
      const res = {};
      res.send = jest.fn(() => res);
      res.status = jest.fn(() => res);
      const next = jest.fn();
      await errorHandler(error, {}, res, next);
      expect(res.send).toHaveBeenCalledWith({
        status: 418,
        statusText: '418 I\'m a teapot',
      });
    });
    it('should send a response including any additional message in the error', async () => {
      const error = new HttpError(
        418,
        'an error occurred',
        'A1',
        {
          message: 'The server refuses to brew coffee because it is, permanently, a teapot',
        },
      );
      const res = {};
      res.send = jest.fn(() => res);
      res.status = jest.fn(() => res);
      const next = jest.fn();
      await errorHandler(error, {}, res, next);
      expect(res.send).toHaveBeenCalledWith({
        status: 418,
        statusText: '418 I\'m a teapot',
        code: 'A1',
        message: 'The server refuses to brew coffee because it is, permanently, a teapot',
      });
    });
    it('it should send the details of the error on the bus', async () => {
      const error = new HttpError(
        418,
        'an error occurred',
        'A1',
        {
          message: 'The server refuses to brew coffee because it is, permanently, a teapot',
        },
      );
      const req = {
        user: {
          accessToken: 'access-token',
          email: 'john.doe@email.com',
        },
      };
      const res = {};
      res.send = jest.fn(() => res);
      res.status = jest.fn(() => res);
      const next = jest.fn();
      await errorHandler(error, req, res, next);
      expect(mockSendMessage).toBeCalledWith({
        _id: expect.any(String),
        message: 'an error occurred',
        application: 'application-name',
        email: 'john.doe@email.com',
        name: 'HttpError',
        stack: expect.any(String),
      }, 'exceptions', 'access-token');
    });
  });
  describe('error handling', () => {
    beforeEach(() => {
      mockSendMessage.mockImplementation(() => Promise.reject());
    });
    it('it should contsend http response ', async () => {
      const req = {
        user: {
          accessToken: 'access-token',
          email: 'john.doe@email.com',
        },
      };
      const res = {};
      res.send = jest.fn(() => res);
      res.status = jest.fn(() => res);
      const next = jest.fn();
      await errorHandler(new HttpError(503), req, res, next);
      expect(next).not.toBeCalled();
      expect(res.send).toHaveBeenCalledWith({
        status: 503,
        statusText: '503 Service Unavailable',
      });
    });
  });
});
