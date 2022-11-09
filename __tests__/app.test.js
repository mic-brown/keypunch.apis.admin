const mockLogInfo = jest.fn();
const mockLogError = jest.fn();
jest.mock('../src/logger', () => ({
  __esModule: true,
  info: mockLogInfo,
  error: mockLogError,
  default: {
    info: mockLogInfo,
    error: mockLogError,
  },
}));

jest.mock('../src/settings', () => ({
  __esModule: true,
  CORS_WHITELIST: 'http://localhost:8080',
  default: {
    CORS_WHITELIST: 'http://localhost:8080',
  },
}));

const mockBearerStrategy = {

};

jest.mock('../src/auth/bearerStrategy', () => mockBearerStrategy);

const mockConfigureRoutes = jest.fn();
const mockUse = jest.fn();
const mockJson = jest.fn(() => ({ json: true }));
const mockCors = jest.fn(() => ({ cors: true }));
const mockApp = { use: mockUse };
const mockExpress = () => mockApp;
mockExpress.json = mockJson;
const mockPassport = {
  initialize: jest.fn(() => ({ passport: true })),
  use: jest.fn(),
};

jest.doMock('express', () => mockExpress);
jest.doMock('cors', () => mockCors);
jest.doMock('passport', () => mockPassport);

jest.mock('../src/middleware', () => ({
  __esModule: true,
  errorHandler: { errorHandler: true },
  mongoModelBinder: { mongoModelBinder: true },
  notFoundHandler: { notFoundHandler: true },
  default: {
    errorHandler: { errorHandler: true },
    mongoModelBinder: { mongoModelBinder: true },
    notFoundHandler: { notFoundHandler: true },
  },
}));

jest.mock('../src/routes', () => ({
  __esModule: true,
  configureRoutes: mockConfigureRoutes,
}));

const app = require('../src/app');

let middleware;

describe('app', () => {
  beforeAll(() => {
    middleware = mockUse.mock.calls.map((args) => args[0]);
  });
  it('it should export the express app', () => {
    expect(app?.default).toBe(mockApp);
  });
  it('it should add the JSON middleware', () => {
    expect(middleware.find(({ json }) => json === true )).toBeTruthy();
  });
  it('it should initialize the the passport', () => {
    expect(mockPassport.initialize).toBeCalled();
    expect(middleware.find(({ passport }) => passport === true )).toBeTruthy();

  });
  it('it should use the configured bearer strategy', () => {
    expect(mockPassport.use).toBeCalledWith(mockBearerStrategy);
  });
  it('it should log that the passport has been initialized', () => {
    expect(mockLogInfo).toBeCalledWith('successfully configured passport with bearer strategy');
  });
  it('it should add the CORS middleware', () => {
    expect(middleware.find(({ cors }) => cors === true )).toBeTruthy();
    expect(mockCors).toBeCalledWith({
      origin: 'http://localhost:8080',
    });
    expect(mockLogInfo).toBeCalledWith('successfully configured CORS: http://localhost:8080');
  });
  it('it should add the mongo model binder middleware', () => {
    expect(middleware.find(({ mongoModelBinder }) => mongoModelBinder === true)).toBeTruthy();
  });
  it('it should configure the routes', () => {
    expect(mockConfigureRoutes).toBeCalledWith(mockApp, mockPassport);
  });
  it('it should add the not found route', () => {
    expect(middleware.find(({ notFoundHandler }) => notFoundHandler === true)).toBeTruthy();
  });
  it('it should add the error handler', () => {
    expect(middleware.find(({ errorHandler }) => errorHandler === true)).toBeTruthy();
  });
});
