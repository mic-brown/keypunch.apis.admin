const mockRewrite = jest.fn();
const mockPreValidateProperty = jest.fn();

jest.doMock('../../src/schema/rewriteHook', mockRewrite);
jest.doMock('../../src/schema/preValidatePropertyHook', mockPreValidateProperty);

const { default: validateBody } = require('../../src/routes/validateBody');

describe('routes.validateBody', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('it should not call the callback', () => {
    const mockCallback = jest.fn();
    validateBody()(mockCallback);
    expect(mockCallback).not.toBeCalled();
  });
  it('it should return a function that can call the callback', () => {
    const mockCallback = jest.fn();
    const handler = validateBody()(mockCallback);
    expect(handler).toBeInstanceOf(Function);
  });
  it('it should call the original callback when the handler is executed', async () => {
    const mockReq = {};
    const mockRes = {};
    const mockNext = jest.fn();
    const mockCallback = jest.fn();
    const handler = validateBody()(mockCallback);
    await handler(mockReq, mockRes, mockNext);
    expect(mockCallback).toBeCalledWith(mockReq, mockRes, mockNext);
  });
  it('it should continue if the body is valid against the specified schema', async () => {
    const schema = {
      id: '/persion',
      type: 'object',
      properties: {
        firstName: {
          type: 'string',
        },
        lastName: {
          type: 'string',
        },
      },
      required: ['firstName', 'lastName'],
    };
    const mockReq = {
      body: {
        firstName: 'John',
        lastName: 'Doe',
      },
    };
    const mockRes = {};
    const mockNext = jest.fn();
    const mockCallback = jest.fn();
    const handler = validateBody(schema)(mockCallback);
    await handler(mockReq, mockRes, mockNext);
    expect(mockCallback).toBeCalledWith(mockReq, mockRes, mockNext);
    expect(mockNext).not.toBeCalled();
  });
  it('it should return a 400 if the body is invalid', async () => {
    const schema = {
      id: '/persion',
      type: 'object',
      properties: {
        firstName: {
          type: 'string',
        },
        lastName: {
          type: 'string',
        },
      },
      required: ['firstName', 'lastName'],
    };
    const mockReq = {
      body: {
        firstName: 'John',
      },
    };
    const mockRes = {};
    const mockSend = jest.fn();
    const mockStatus = jest.fn(() => mockRes);
    mockRes.send = mockSend;
    mockRes.status = mockStatus;
    const mockNext = jest.fn();
    const mockCallback = jest.fn();
    const handler = validateBody(schema)(mockCallback);
    await handler(mockReq, mockRes, mockNext);
    expect(mockStatus).toBeCalledWith(400);
    expect(mockSend).toBeCalledWith({
      status: 400,
      statusText: '400 Bad Request',
      errors: [
        {
          argument: 'lastName',
          message: 'requires property "lastName"',
          name: 'required',
          path: [],
          property: 'instance',
        },
      ],
    });
    expect(mockCallback).not.toBeCalledWith(mockReq, mockRes, mockNext);
    expect(mockNext).not.toBeCalled();
  });
  it('it should be able to manage dependant schemas', async () => {
    const schema = {
      id: '/persion',
      type: 'object',
      properties: {
        firstName: {
          type: 'string',
        },
        lastName: {
          type: 'string',
        },
        address: {
          $ref: '/address',
        },
      },
      required: ['firstName', 'lastName', 'address'],
    };
    const dependantSchema = {
      id: '/address',
      type: 'object',
      properties: {
        line1: {
          type: 'string',
        },
        line2: {
          type: 'string',
        },
      },
      required: ['line1', 'line2'],
    };
    const mockReq = {
      body: {
        firstName: 'John',
        lastName: 'Doe',
        address: {
          line1: '10 Downing Street',
          line2: 'Westminster',
        },
      },
    };
    const mockRes = {};
    const mockNext = jest.fn();
    const mockCallback = jest.fn();
    const handler = validateBody(schema, [dependantSchema])(mockCallback);
    await handler(mockReq, mockRes, mockNext);
    expect(mockCallback).toBeCalledWith(mockReq, mockRes, mockNext);
    expect(mockNext).not.toBeCalled();
  });
  it('it should call next with the error in the event of that error', async () => {
    const mockError = new Error('an error');
    const mockReq = {};
    const mockRes = {};
    const mockNext = jest.fn();
    const mockCallback = jest.fn(() => Promise.reject(mockError));
    const handler = validateBody()(mockCallback);

    await handler(mockReq, mockRes, mockNext);
    expect(mockNext).toBeCalledWith(mockError);
  });
});
