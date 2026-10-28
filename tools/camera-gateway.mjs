import http from 'node:http';
import https from 'node:https';
import { createHash, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const configPath = resolve(
  process.env.CAMERA_GATEWAY_CONFIG ?? 'camera-gateway.local.json'
);
const config = JSON.parse(await readFile(configPath, 'utf8'));

const listenHost = String(config.listenHost ?? '127.0.0.1');
const listenPort = Number(config.listenPort ?? 8787);
const allowedOrigin = String(
  config.allowedOrigin ?? 'https://iotstudio.web.app'
);

function readTarget(name) {
  const value = String(config[name] ?? '').trim();
  if (!value) throw new Error(`Falta ${name} en ${configPath}`);
  const target = new URL(value);
  if (!['http:', 'https:'].includes(target.protocol)) {
    throw new Error(`${name} debe usar HTTP o HTTPS`);
  }
  return target;
}

const captureTarget = readTarget('captureUrl');
const streamTarget = readTarget('streamUrl');
const gardenTokenSha256 = String(
  process.env.GARDEN_NODE_TOKEN_SHA256 ?? config.gardenTokenSha256 ?? ''
).trim().toLowerCase();
const latestTelemetryByChannel = new Map();

function parseChannel(value) {
  const channel = Number(value);
  return Number.isInteger(channel) && channel >= 1 && channel <= 9
    ? channel
    : null;
}

function validGardenToken(request) {
  if (!/^[a-f0-9]{64}$/.test(gardenTokenSha256)) return false;
  const authorization = String(request.headers.authorization ?? '');
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;

  const actual = Buffer.from(
    createHash('sha256').update(match[1], 'utf8').digest('hex'),
    'utf8'
  );
  const expected = Buffer.from(gardenTokenSha256, 'utf8');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 4096) throw new Error('Payload too large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function validateTelemetry(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null;
  }

  const channel = parseChannel(payload.channel);
  const { temperature, humidity, status } = payload;
  if (
    channel === null ||
    typeof temperature !== 'number' ||
    !Number.isFinite(temperature) ||
    temperature < -40 ||
    temperature > 85 ||
    typeof humidity !== 'number' ||
    !Number.isFinite(humidity) ||
    humidity < 0 ||
    humidity > 100 ||
    status !== 'online'
  ) {
    return null;
  }

  return { channel, temperature, humidity, status };
}

function setPublicHeaders(response) {
  response.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  response.setHeader('Vary', 'Origin');
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  response.setHeader('Referrer-Policy', 'no-referrer');
}

function sendJson(response, status, payload) {
  setPublicHeaders(response);
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function proxyCamera(request, response, target, expectedContentType) {
  const transport = target.protocol === 'https:' ? https : http;
  const upstreamRequest = transport.request(
    target,
    {
      method: 'GET',
      headers: {
        Accept: expectedContentType,
        'User-Agent': 'Bi-Tech-Camera-Gateway/1.0',
      },
    },
    (upstreamResponse) => {
      const statusCode = upstreamResponse.statusCode ?? 502;
      const contentType = String(
        upstreamResponse.headers['content-type'] ?? expectedContentType
      );

      setPublicHeaders(response);
      response.statusCode = statusCode;
      response.setHeader('Content-Type', contentType);
      if (upstreamResponse.headers['content-length']) {
        response.setHeader(
          'Content-Length',
          upstreamResponse.headers['content-length']
        );
      }
      response.flushHeaders();
      upstreamResponse.pipe(response);

      response.on('close', () => upstreamResponse.destroy());
    }
  );

  upstreamRequest.setTimeout(10000, () => {
    upstreamRequest.destroy(new Error('Camera Node timeout'));
  });
  upstreamRequest.on('error', (error) => {
    console.error(
      `Camera Node no disponible para ${target.pathname}: ${error.message}`
    );
    if (!response.headersSent) {
      sendJson(response, 502, {
        status: 'offline',
        error: 'Camera Node unavailable',
      });
    } else {
      response.destroy(error);
    }
  });
  request.on('close', () => upstreamRequest.destroy());
  upstreamRequest.end();
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url ?? '/', 'http://camera-gateway.local');

  if (request.method === 'OPTIONS') {
    setPublicHeaders(response);
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader(
      'Access-Control-Allow-Headers',
      'Accept, Authorization, Content-Type'
    );
    response.writeHead(204);
    response.end();
    return;
  }

  if (requestUrl.pathname === '/health') {
    sendJson(response, 200, {
      status: 'ready',
      gardenTelemetry: /^[a-f0-9]{64}$/.test(gardenTokenSha256)
        ? 'ready'
        : 'not-configured',
    });
    return;
  }

  if (
    request.method === 'POST' &&
    requestUrl.pathname === '/garden/telemetry'
  ) {
    if (!/^[a-f0-9]{64}$/.test(gardenTokenSha256)) {
      sendJson(response, 503, { error: 'Garden telemetry not configured' });
      return;
    }
    if (!validGardenToken(request)) {
      sendJson(response, 401, { error: 'Unauthorized' });
      return;
    }

    try {
      const telemetry = validateTelemetry(await readJsonBody(request));
      if (!telemetry) {
        sendJson(response, 400, { error: 'Invalid telemetry' });
        return;
      }
      const latest = { ...telemetry, timestamp: Date.now() };
      latestTelemetryByChannel.set(telemetry.channel, latest);
      sendJson(response, 200, { ok: true, telemetry: latest });
    } catch {
      sendJson(response, 400, { error: 'Invalid JSON body' });
    }
    return;
  }

  const gardenLatestMatch = requestUrl.pathname.match(
    /^\/garden\/channel\/([^/]+)\/latest$/
  );
  if (request.method === 'GET' && gardenLatestMatch) {
    const channel = parseChannel(gardenLatestMatch[1]);
    if (channel === null) {
      sendJson(response, 400, { error: 'Channel must be between 1 and 9' });
      return;
    }
    const latest = latestTelemetryByChannel.get(channel);
    if (!latest) {
      sendJson(response, 404, {
        channel,
        status: 'unavailable',
        message: 'No disponible',
      });
      return;
    }
    sendJson(response, 200, latest);
    return;
  }

  if (request.method !== 'GET') {
    sendJson(response, 405, { error: 'Method not allowed' });
    return;
  }

  if (requestUrl.pathname === '/camera/capture') {
    proxyCamera(request, response, captureTarget, 'image/jpeg');
    return;
  }

  if (requestUrl.pathname === '/camera/stream') {
    proxyCamera(
      request,
      response,
      streamTarget,
      'multipart/x-mixed-replace'
    );
    return;
  }

  sendJson(response, 404, { error: 'Not found' });
});

server.listen(listenPort, listenHost, () => {
  console.log(`Bi-Tech Gateway listo en http://${listenHost}:${listenPort}`);
  console.log('Capture: /camera/capture');
  console.log('Stream: /camera/stream');
  console.log('Garden POST: /garden/telemetry');
  console.log('Garden GET: /garden/channel/:channel/latest');
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
