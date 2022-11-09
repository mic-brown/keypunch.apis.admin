const { ObjectId } = require('bson');

jest.mock('../../src/settings', () => ({
  __esModule: true,
  B2C: {
    CLIENTID: 'b2c_clientId',
    POLICY: 'b2c_policy',
    TENANT: 'b2c_tenant',
    DOMAIN: 'b2c_domain',
    DISCOVERY: 'b2c_discovery',
    VERSION: 'b2c_version',
    SCOPES: ['b2c_scope1', 'b2c_scope2'],
  },
  default: {
    CLIENTID: 'b2c_clientId',
    POLICY: 'b2c_policy',
    TENANT: 'b2c_tenant',
    DOMAIN: 'b2c_domain',
    DISCOVERY: 'b2c_discovery',
    VERSION: 'b2c_version',
    SCOPES: ['b2c_scope1', 'b2c_scope2'],
  },
}));

const mockBearerStrategy = jest.fn(() => ({ strategy: 'b2c_bearer_strategy' }));
jest.doMock('passport-azure-ad', () => ({
  BearerStrategy: mockBearerStrategy,
}));

const mockBuildUserFromPayload = jest.fn(() => ({
  _id: new ObjectId('6360fd331c9298ff689eb6b8'),
  email: 'john.doe@email.com',
  name: 'John Doe',
  givenName: 'John',
  familyName: 'Doe',
  roles: ['role1', 'role2'],
  enabled: true,
}));
jest.doMock('../../src/auth/buildUserFromPayload',
  () => mockBuildUserFromPayload);

const { default: bearerStrategy } = require('../../src/auth/bearerStrategy');

describe('auth.bearerStrategy', () => {
  it('it should configure the bearer strategy with the settings', () => {
    expect(mockBearerStrategy).toBeCalledWith({
      identityMetadata: `https://b2c_domain/b2c_tenant/b2c_policy/b2c_version/b2c_discovery`,
      clientID: 'b2c_clientId',
      audience: 'b2c_clientId',
      policyName: 'b2c_policy',
      isB2C: true,
      validateIssuer: true,
      loggingLevel: 'warn',
      passReqToCallback: false,
      scope: ['b2c_scope1', 'b2c_scope2'],
    }, expect.any(Function));
  });
  it('it should configure the user from the token payload', () => {
    const [ [ _options, verifyCallback ] ] = mockBearerStrategy.mock.calls;
    const mockDone = jest.fn();
    verifyCallback('b2c_token', mockDone);
    expect(mockBuildUserFromPayload).toBeCalled();
    expect(mockDone).toBeCalledWith(null,
      {
        _id: new ObjectId('6360fd331c9298ff689eb6b8'),
        email: 'john.doe@email.com',
        name: 'John Doe',
        givenName: 'John',
        familyName: 'Doe',
        roles: ['role1', 'role2'],
        enabled: true,
      },
      'b2c_token',
    );
  });
  it('it should export the configured bearer strategy', () => {
    expect(bearerStrategy).toEqual({ strategy: 'b2c_bearer_strategy' });
  });
});
