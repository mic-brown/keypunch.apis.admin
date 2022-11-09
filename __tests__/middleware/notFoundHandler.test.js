import notFoundHandler from '../../src/middleware/notFoundHandler';

describe('middleware.notFoundHandler', () => {
  it('should set a status code of 404', () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.send = jest.fn(() => res);
    const next = jest.fn();

    notFoundHandler({}, res, next);

    expect(res.status).toBeCalledWith(404);
  });
  it('should set send a 404 error response', () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.send = jest.fn(() => res);
    const next = jest.fn();

    notFoundHandler({}, res, next);

    expect(res.send).toBeCalledWith({
      status: 404,
      statusText: '404 Not Found',
    });
  });

  it('should not call next', () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.send = jest.fn(() => res);
    const next = jest.fn();

    notFoundHandler({}, res, next);

    expect(next).not.toBeCalled();
  });
});
