import HttpError from '../src/httpError';

describe('httpHelper', () => {
  it('it should set the properties from the constructor', () => {
    const error = new HttpError(418, 'test-message', 123, { moreInfo: 456 });
    const { status, message, code, inner } = error;
    expect(status).toEqual(418);
    expect(message).toEqual('test-message');
    expect(code).toEqual(123);
    expect(inner).toEqual({
      moreInfo: 456,
    });
  });
});
