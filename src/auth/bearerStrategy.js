import { BearerStrategy } from 'passport-azure-ad';
import { B2C } from '../settings';
import buildUserFromPayload from './buildUserFromPayload';

const {
  CLIENTID,
  POLICY,
  TENANT,
  DOMAIN,
  DISCOVERY,
  VERSION,
  SCOPES,
} = B2C;

const options = {
  identityMetadata: `https://${DOMAIN}/${TENANT}/${POLICY}/${VERSION}/${DISCOVERY}`,
  clientID: CLIENTID,
  audience: CLIENTID,
  policyName: POLICY,
  isB2C: true,
  validateIssuer: true,
  loggingLevel: 'warn',
  passReqToCallback: false,
  scope: SCOPES,
};

const bearerStrategy = new BearerStrategy(options, (payload, done) => {
  const user = buildUserFromPayload(payload);
  done(null, user, payload);
});

export default bearerStrategy;
