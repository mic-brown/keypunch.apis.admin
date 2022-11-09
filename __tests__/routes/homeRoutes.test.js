const mockGet = jest.fn();
const mockRouter = { get: mockGet };
const mockExpress = { Router: jest.fn().mockImplementation(() => mockRouter ) };
jest.mock('express', () => mockExpress);

const homeRoute = require('../../src/routes/homeRoute');

describe('routes.homeRoute', () => {
  it('should export the router', () => {
    expect(homeRoute).toBe(mockRouter);
  });
  it('it should create a GET route indicating the service is available', () => {
    expect(mockGet).toBeCalledWith('/', expect.any(Function));
  });
  it('it should create a route that sends a 200', () => {
    const [[ _path, handler]] = mockGet.mock.calls;
    const mockRes = {};
    const mockStatus = jest.fn(() => mockRes);
    const mockSetHeader = jest.fn(() => mockRes);
    const mockSend = jest.fn();
    mockRes.status = mockStatus;
    mockRes.setHeader = mockSetHeader;
    mockRes.send = mockSend;
    const mockNext = jest.fn();
    handler({}, mockRes, mockNext);
    expect(mockStatus).toBeCalledWith(200);
  });
  it('it should set the cache control header', () => {
    const [[ _path, handler]] = mockGet.mock.calls;
    const mockRes = {};
    const mockStatus = jest.fn(() => mockRes);
    const mockSetHeader = jest.fn(() => mockRes);
    const mockSend = jest.fn();
    mockRes.status = mockStatus;
    mockRes.setHeader = mockSetHeader;
    mockRes.send = mockSend;
    const mockNext = jest.fn();
    handler({}, mockRes, mockNext);
    expect(mockSetHeader).toBeCalledWith('cache-control', 'no-cache');
  });
  it('it should send a JSON object indicating the service is available', () => {
    const [[ _path, handler]] = mockGet.mock.calls;
    const mockRes = {};
    const mockStatus = jest.fn(() => mockRes);
    const mockSetHeader = jest.fn(() => mockRes);
    const mockSend = jest.fn();
    mockRes.status = mockStatus;
    mockRes.setHeader = mockSetHeader;
    mockRes.send = mockSend;
    const mockNext = jest.fn();
    handler({}, mockRes, mockNext);
    expect(mockSend).toBeCalledWith({ status: 'available' });
  });
  it('it should not call next', () => {
    const [[ _path, handler]] = mockGet.mock.calls;
    const mockRes = {};
    const mockStatus = jest.fn(() => mockRes);
    const mockSetHeader = jest.fn(() => mockRes);
    const mockSend = jest.fn();
    mockRes.status = mockStatus;
    mockRes.setHeader = mockSetHeader;
    mockRes.send = mockSend;
    const mockNext = jest.fn();
    handler({}, mockRes, mockNext);
    expect(mockNext).not.toBeCalled();
  });
});
