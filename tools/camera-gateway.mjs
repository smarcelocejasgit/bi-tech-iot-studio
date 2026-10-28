import http from 'node:http';
import https from 'node:https';
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

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url ?? '/', 'http://camera-gateway.local');

  if (request.method === 'OPTIONS') {
    setPublicHeaders(response);
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Accept');
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method !== 'GET') {
    sendJson(response, 405, { error: 'Method not allowed' });
    return;
  }

  if (requestUrl.pathname === '/health') {
    sendJson(response, 200, { status: 'ready' });
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
  console.log(`Bi-Tech Camera Gateway listo en http://${listenHost}:${listenPort}`);
  console.log('Capture: /camera/capture');
  console.log('Stream: /camera/stream');
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
