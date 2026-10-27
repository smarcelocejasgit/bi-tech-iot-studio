'use strict';

const assert = require('node:assert/strict');

const TEST_TOKEN = 'local-emulator-garden-node-token';
const FUNCTION_URL =
  process.env.BITECH_FUNCTION_EMULATOR_URL ||
  'http://127.0.0.1:5000/api/garden';

async function request(path, options = {}) {
  const response = await fetch(`${FUNCTION_URL}${path}`, options);
  const body = await response.json();
  return { response, body };
}

async function main() {
  const missing = await request('/telemetry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ temperature: 17.3, humidity: 60, status: 'online' }),
  });
  assert.equal(missing.response.status, 401);

  const invalid = await request('/telemetry', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer invalid-emulator-token',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ temperature: 17.3, humidity: 60, status: 'online' }),
  });
  assert.equal(invalid.response.status, 403);

  const accepted = await request('/telemetry', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TEST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ temperature: 17.3, humidity: 60, status: 'online' }),
  });
  assert.equal(accepted.response.status, 200);

  const latest = await request('/latest');
  assert.equal(latest.response.status, 200);
  assert.equal(latest.body.telemetry.temperature, 17.3);
  assert.equal(latest.body.telemetry.humidity, 60);
  assert.equal(latest.body.telemetry.status, 'online');
  assert.equal(typeof latest.body.telemetry.timestamp, 'number');
  assert.equal(JSON.stringify(latest.body).includes(TEST_TOKEN), false);

  process.stdout.write('Emulador: token, escritura RTDB y GET /latest verificados.\n');
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
