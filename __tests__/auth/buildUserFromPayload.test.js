const { ObjectId } = require('bson');

const { default: buildUserFromPayload } = require('../../src/auth/buildUserFromPayload');

const payload = {
  emails: ['john.doe@emai.com'],
  name: 'John Doe',
  given_name: 'John',
  family_name: 'Doe',
  extension_Roles: 'role1,role2,role3',
  extension_UserID: '6360fd331c9298ff689eb6b8',
  extension_AccountEnabled: true,
};

describe('auth.buildUserFromPayload', () => {
  it('it should build the user object from the claims', () => {
    const user = buildUserFromPayload(payload);
    expect(user).toEqual({
      _id: new ObjectId('6360fd331c9298ff689eb6b8'),
      email: 'john.doe@emai.com',
      name: 'John Doe',
      givenName: 'John',
      familyName: 'Doe',
      roles: ['role1', 'role2', 'role3'],
      enabled: true,
      hasRole: expect.any(Function),
    });
  });
  describe('hasRoles', () => {
    it('it should be able to determine if the user has the specified roles', () => {
      const { hasRole } = buildUserFromPayload(payload);
      expect(hasRole('role2')).toEqual(true);
      expect(hasRole('roleA', 'role3')).toEqual(true);
    });
    it('it should be able to determine if the user has does not specified roles', () => {
      const { hasRole } = buildUserFromPayload(payload);
      expect(hasRole('roleA')).toEqual(false);
      expect(hasRole('roleA', 'roleB')).toEqual(false);
    });
  });
});
