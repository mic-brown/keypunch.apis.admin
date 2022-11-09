/* eslint-disable no-console */
import debug from 'debug';
import { APPNAME as APP } from './settings';

const infoLogger = debug(`${APP}:info`);
infoLogger.log = console.info.bind(console);

const errorLog = debug(`${APP}:error`);
errorLog.log = console.error.bind(console);

export const info = (message) => infoLogger(message);

export const error = (message) => errorLog(message);

export default {
  info,
  error,
};
