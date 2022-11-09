import { ObjectId } from 'bson';

const buildUserFromPayload = (payload) => {
  const {
    emails,
    name,
    given_name: givenName,
    family_name: familyName,
    extension_Roles: roles,
    extension_UserID: userId,
    extension_AccountEnabled: accountEnabled,
  } = payload;

  let _id = userId;
  const [email] = emails || [];

  if (/^[0-9a-fA-F]{24}$/gm.test(userId)) {
    _id = new ObjectId(userId);
  }

  const user = {
    _id,
    email,
    name,
    givenName,
    familyName,
    roles: roles ? roles.split(',') : [],
    enabled: accountEnabled,
  };

  const hasRole = function () {
    for (let i = 0; i < arguments.length; i++) {
      const arg = arguments[i];
      if (this.roles.indexOf(arg) !== -1) {
        return true;
      }
    }
    return false;
  };

  user.hasRole = hasRole.bind(user);

  return user;
};

export default buildUserFromPayload;
