import createServer from '../backend/server.cjs';

let server;

const getServer = async () => {
  if (!server) {
    server = await createServer();
    await server.initialize();
  }
  return server;
};

const readRawBody = (req) => new Promise((resolve, reject) => {
  if (req.readableEnded || typeof req.on !== 'function' || req.readable === false) {
    resolve(Buffer.alloc(0));
    return;
  }
  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', () => resolve(Buffer.concat(chunks)));
  req.on('error', reject);
});

export default async function handler(req, res) {
  const app = await getServer();

  const headers = { ...req.headers };
  delete headers['content-length'];

  let payload;
  const hasBodyHeader = Boolean(
    req.headers['transfer-encoding'] || Number(req.headers['content-length'] || 0) > 0,
  );

  if (['POST', 'PUT', 'PATCH'].includes(req.method) || hasBodyHeader) {
    if (req.body !== undefined) {
      payload = typeof req.body === 'string' || Buffer.isBuffer(req.body)
        ? req.body
        : JSON.stringify(req.body);
    } else {
      const raw = await readRawBody(req);
      if (raw.length > 0) {
        payload = raw;
      }
    }
  }

  const response = await app.inject({
    method: req.method,
    url: req.url,
    headers,
    payload,
  });

  Object.entries(response.headers).forEach(([key, value]) => {
    if (value !== undefined) {
      res.setHeader(key, value);
    }
  });

  res.statusCode = response.statusCode;
  res.end(response.rawPayload);
}
