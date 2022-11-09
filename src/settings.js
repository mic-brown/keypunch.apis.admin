/* eslint-disable prefer-destructuring */
import 'dotenv/config';

export const PORT = Number.parseInt(process.env.PORT, 10) || 8080;
export const CORS_WHITELIST = process.env.CORS_WHITELIST;
export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_ALGORITHM = process.env.JWT_ALGORITHM || 'HS256';
export const MONGO_CONNECTION = process.env.MONGO_CONNECTION;
export const DEFAULT_MONGO_DB = process.env.DEFAULT_MONGO_DB;
export const APPNAME = process.env.APPNAME || 'app';
export const BUS = {
  CONNECTION: process.env.BUS_CONNECTION,
};
export const B2C = {
  TENANT:  process.env.B2C_TENANT,
  CLIENTID: process.env.B2C_CLIENTID,
  POLICY: process.env.B2C_POLICY,
  DOMAIN: process.env.B2C_DOMAIN,
  AUTHORITY: 'login.microsoftonline.com',
  DISCOVERY: '.well-known/openid-configuration',
  VERSION: 'v2.0',
  SCOPES: process.env.B2C_SCOPES.split(',')
    .map((scope) => scope?.trim()),
};

export default {
  PORT,
  CORS_WHITELIST,
  JWT_SECRET,
  JWT_ALGORITHM,
  MONGO_CONNECTION,
  APPNAME,
  BUS,
  B2C,
};
