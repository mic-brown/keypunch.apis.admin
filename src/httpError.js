const HTTPERROR = 'HttpError';

class HttpError extends Error {
  #_code;
  #_inner;
  #status;

  constructor(status, message, code, inner = {}) {
    super(message);
    this.name = HTTPERROR;
    this.#status = status;
    this.#_code = code;
    this.#_inner = inner;
  }

  get status() {
    return this.#status;
  }

  get inner() {
    return this.#_inner;
  }

  get code() {
    return this.#_code;
  }
}

export default HttpError;
