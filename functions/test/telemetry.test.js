'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
  LATEST_READING_PATH,
  createTelemetryHandler,
  sha256Hex,
  validateTelemetryPayload,
} = require('../lib/telemetry');

const TEST_TOKEN = 'local-test-token-not-a-production-secret';
const TEST_TOKEN_HASH = sha256Hex(TEST_TOKEN);

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    set(name, value) {
      this.headers[name] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    },
    send(value) {
      this.body = value;
      return this;
    },
  };
}

function createRequest({ method, path, token, body }) {
  const headers = token ? { authorization: `Bearer ${token}` } : {};
  return {
    method,
    path,
    url: path,
    body,
    headers,
    get(name) {
      return headers[name.toLowerCase()];
    },
  };
}

function createHarness() {
  let stored = null;
  const repository = {
    async writeLatest(reading) {
      stored = { ...reading };
    },
    async readLatest() {
      return stored;
    },
  };
  const handler = createTelemetryHandler({
    repository,
    getExpectedTokenHash: () => TEST_TOKEN_HASH,
    now: () => 1793059200000,
  });
  return { handler, getStored: () => stored };
}

test('usa una ruta RTDB fija Escuela → Lab → Nodo → latest', () => {
  assert.equal(
    LATEST_READING_PATH,
    'schools/escuela-estacion/labs/lab-01/nodes/garden-node-01/latest'
  );
});

test('valida tipos y rangos básicos', () => {
  assert.equal(
    validateTelemetryPayload({ temperature: 17.3, humidity: 60, status: 'online' }).ok,
    true
  );
  assert.equal(
    validateTelemetryPayload({ temperature: '17.3', humidity: 60, status: 'online' }).ok,
    false
  );
  assert.equal(
    validateTelemetryPayload({ temperature: 17.3, humidity: 101, status: 'online' }).ok,
    false
  );
});

test('rechaza requests sin token o con token inválido', async () => {
  const { handler } = createHarness();

  const missing = createResponse();
  await handler(
    createRequest({ method: 'POST', path: '/telemetry', body: {} }),
    missing
  );
  assert.equal(missing.statusCode, 401);

  const invalid = createResponse();
  await handler(
    createRequest({
      method: 'POST',
      path: '/telemetry',
      token: 'invalid-token-long-enough',
      body: { temperature: 17.3, humidity: 60, status: 'online' },
    }),
    invalid
  );
  assert.equal(invalid.statusCode, 403);
});

test('guarda sólo la lectura validada, sin token, con timestamp del servidor', async () => {
  const { handler, getStored } = createHarness();
  const response = createResponse();

  await handler(
    createRequest({
      method: 'POST',
      path: '/telemetry',
      token: TEST_TOKEN,
      body: { temperature: 17.3, humidity: 60, status: 'online' },
    }),
    response
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(getStored(), {
    schemaVersion: 1,
    temperature: 17.3,
    humidity: 60,
    status: 'online',
    timestamp: 1793059200000,
  });
  assert.equal(JSON.stringify(getStored()).includes(TEST_TOKEN), false);
});

test('GET /latest devuelve sólo identidad y última telemetría', async () => {
  const { handler } = createHarness();
  await handler(
    createRequest({
      method: 'POST',
      path: '/telemetry',
      token: TEST_TOKEN,
      body: { temperature: 17.3, humidity: 60, status: 'online' },
    }),
    createResponse()
  );

  const response = createResponse();
  await handler(createRequest({ method: 'GET', path: '/latest' }), response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.identity.schoolId, 'escuela-estacion');
  assert.deepEqual(response.body.telemetry, {
    temperature: 17.3,
    humidity: 60,
    status: 'online',
    timestamp: 1793059200000,
  });
  assert.equal(JSON.stringify(response.body).includes(TEST_TOKEN), false);
});
