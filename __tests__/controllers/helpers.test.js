const mockwriteHead = jest.fn();
const mockWrite = jest.fn();
const mockSend = jest.fn();
const mockHasNext = jest.fn();
const mockNext = jest.fn();
const mockCursor = {
  hasNext: mockHasNext,
  next: mockNext,
};
const mockResponse = {
  writeHead: mockwriteHead,
  write: mockWrite,
  send: mockSend,
};

const { sendChunked } = require('../../src/controllers/helpers');
const mockData = [
  { id: 1, value: 'string-1' },
  { id: 2, value: 'string-2' },
  { id: 3, value: 'string-3' },
  { id: 4, value: 'string-4' },
];
describe('controllers.helpers', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockHasNext
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    mockNext
      .mockResolvedValueOnce(mockData[0])
      .mockResolvedValueOnce(mockData[1])
      .mockResolvedValueOnce(mockData[2])
      .mockResolvedValueOnce(mockData[3]);
  });
  it('it should set a default status code', async () => {
    await sendChunked(mockCursor, mockResponse);
    expect(mockResponse.writeHead).toBeCalledWith(200, expect.anything());
  });
  it('it should be possible to overwrite the status code', async () => {
    await sendChunked(mockCursor, mockResponse, 201);
    expect(mockResponse.writeHead).toBeCalledWith(201, expect.anything());
  });
  it('it should set the default headers', async () => {
    await sendChunked(mockCursor, mockResponse);
    expect(mockResponse.writeHead).toBeCalledWith(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    });
  });
  it('it should set the default headers', async () => {
    await sendChunked(mockCursor, mockResponse, 201, {
      'Another-Header': 'Header-Value',
    });
    expect(mockResponse.writeHead).toBeCalledWith(201, {
      'Content-Type': 'application/json; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Another-Header': 'Header-Value',
    });
  });
  it('it should send the values from the cursor to the response as a JSON array', async () => {
    await sendChunked(mockCursor, mockResponse);
    expect(mockWrite).toHaveBeenNthCalledWith(1, '[');
    expect(mockWrite).toHaveBeenNthCalledWith(2, JSON.stringify(mockData[0]));
    expect(mockWrite).toHaveBeenNthCalledWith(3, ',');
    expect(mockWrite).toHaveBeenNthCalledWith(4, JSON.stringify(mockData[1]));
    expect(mockWrite).toHaveBeenNthCalledWith(5, ',');
    expect(mockWrite).toHaveBeenNthCalledWith(6, JSON.stringify(mockData[2]));
    expect(mockWrite).toHaveBeenNthCalledWith(7, ',');
    expect(mockWrite).toHaveBeenNthCalledWith(8, JSON.stringify(mockData[3]));
    expect(mockWrite).toHaveBeenNthCalledWith(9, ']');
  });
});
