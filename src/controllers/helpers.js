export const sendChunked = async (cursor, response, statusCode = 200, headers = {}) => {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Transfer-Encoding': 'chunked',
    ...headers,
  });
  response.write('[');
  let hasNext = await cursor.hasNext();
  while (hasNext) {
    const doc = await cursor.next();
    response.write(JSON.stringify(doc));
    hasNext = await cursor.hasNext();
    if (hasNext) {
      response.write(',');
    }
  }
  response.write(']');
  response.send();
};

export default {
  sendChunked,
};
