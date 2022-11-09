const { default: authorizeRoute } = require('../../src/routes/authorize');

describe('routes.authorize', () => {
  it('it should be able to validate the user has the specified role', async () => {
    const mockRouteHandler = jest.fn(() => Promise.resolve());
    const mockHasRole = jest.fn(() => true);
    const mockRequest = { user: { hasRole: mockHasRole, enabled: true }};
    const mockSend = jest.fn();
    const mockResponse = { send: mockSend };
    const mockStatus = jest.fn(() => mockResponse);
    mockResponse.status = mockStatus;
    const mockNext = jest.fn();
    const route = authorizeRoute(['role-1', 'role-2'])(mockRouteHandler);
    await route(mockRequest, mockResponse, mockNext);
    expect(mockHasRole).toBeCalledWith('role-1', 'role-2');
    expect(mockRouteHandler).toBeCalledWith(mockRequest, mockResponse, mockNext);
    expect(mockNext).not.toBeCalled();
  });
  it('it should send a 403 if the account is disabled', async () => {
    const mockRouteHandler = jest.fn(() => Promise.resolve());
    const mockHasRole = jest.fn(() => true);
    const mockRequest = { user: { hasRole: mockHasRole, enabled: false }};
    const mockSend = jest.fn();
    const mockResponse = { send: mockSend };
    const mockStatus = jest.fn(() => mockResponse);
    mockResponse.status = mockStatus;
    const mockNext = jest.fn();
    const route = authorizeRoute(['role-1', 'role-2'])(mockRouteHandler);
    await route(mockRequest, mockResponse, mockNext);
    expect(mockRouteHandler).not.toBeCalled();
    expect(mockStatus).toBeCalledWith(403);
    expect(mockSend).toBeCalledWith({
      status: 403,
      statusText: '403 Forbidden',
    });
    expect(mockNext).not.toBeCalled();
  });
  it('it should send a 403 if the account if the user doesn\'t have a required role', async () => {
    const mockRouteHandler = jest.fn(() => Promise.resolve());
    const mockHasRole = jest.fn(() => false);
    const mockRequest = { user: { hasRole: mockHasRole, enabled: true }};
    const mockSend = jest.fn();
    const mockResponse = { send: mockSend };
    const mockStatus = jest.fn(() => mockResponse);
    mockResponse.status = mockStatus;
    const mockNext = jest.fn();
    const route = authorizeRoute(['role-1', 'role-2'])(mockRouteHandler);
    await route(mockRequest, mockResponse, mockNext);
    expect(mockHasRole).toBeCalledWith('role-1', 'role-2');
    expect(mockRouteHandler).not.toBeCalled();
    expect(mockNext).not.toBeCalled();
  });
  it('it should continue in the event of an error', async () => {
    const mockRouteHandler = jest.fn(() => Promise.reject('some-error'));
    const mockHasRole = jest.fn(() => true);
    const mockRequest = { user: { hasRole: mockHasRole, enabled: true }};
    const mockSend = jest.fn();
    const mockResponse = { send: mockSend };
    const mockStatus = jest.fn(() => mockResponse);
    mockResponse.status = mockStatus;
    const mockNext = jest.fn();
    const route = authorizeRoute(['role-1', 'role-2'])(mockRouteHandler);
    await route(mockRequest, mockResponse, mockNext);
    expect(mockHasRole).toBeCalledWith('role-1', 'role-2');
    expect(mockRouteHandler).toBeCalledWith(mockRequest, mockResponse, mockNext);
    expect(mockNext).toBeCalledWith('some-error');
  });
});
