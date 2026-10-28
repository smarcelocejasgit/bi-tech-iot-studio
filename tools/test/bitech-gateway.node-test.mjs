import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import test from 'node:test';

const TEST_TOKEN = 'bitech-gateway-test-token';
const TEST_TOKEN_HASH = createHash('sha256')
  .update(TEST_TOKEN, 'utf8')
  .digest('hex');

async function freePort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  server.close();
  await once(server, 'close');
  return port;
}

async function waitForGateway(baseUrl) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
    } catch {
      // El proceso todavía está iniciando.
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  throw new Error('El gateway no inició a tiempo');
}

test('aísla la última telemetría de los canales 1 y 2', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'bitech-gateway-'));
  const configPath = join(directory, 'gateway.json');
  const port = await freePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  await writeFile(
    configPath,
    JSON.stringify({
      listenHost: '127.0.0.1',
      listenPort: port,
      allowedOrigin: 'https://iotstudio.web.app',
      captureUrl: 'http://127.0.0.1:9/capture',
      streamUrl: 'http://127.0.0.1:9/stream',
    })
  );

  const child = spawn(process.execPath, [resolve('tools/camera-gateway.mjs')], {
    cwd: resolve('.'),
    env: {
      ...process.env,
      CAMERA_GATEWAY_CONFIG: configPath,
      GARDEN_NODE_TOKEN_SHA256: TEST_TOKEN_HASH,
    },
    stdio: 'ignore',
  });

  try {
    await waitForGateway(baseUrl);

    const unauthorized = await fetch(`${baseUrl}/garden/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: 1,
        temperature: 18.4,
        humidity: 62,
        status: 'online',
      }),
    });
    assert.equal(unauthorized.status, 401);

    for (const telemetry of [
      { channel: 1, temperature: 18.4, humidity: 62, status: 'online' },
      { channel: 2, temperature: 21.8, humidity: 55, status: 'online' },
    ]) {
      const response = await fetch(`${baseUrl}/garden/telemetry`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(telemetry),
      });
      assert.equal(response.status, 200);
    }

    const channel1 = await fetch(`${baseUrl}/garden/channel/1/latest`);
    const channel2 = await fetch(`${baseUrl}/garden/channel/2/latest`);
    const channel3 = await fetch(`${baseUrl}/garden/channel/3/latest`);
    const channel1Payload = await channel1.json();
    const channel2Payload = await channel2.json();
    assert.equal(typeof channel1Payload.timestamp, 'number');
    assert.equal(typeof channel2Payload.timestamp, 'number');
    delete channel1Payload.timestamp;
    delete channel2Payload.timestamp;
    assert.deepEqual(channel1Payload, {
      channel: 1,
      temperature: 18.4,
      humidity: 62,
      status: 'online',
    });
    assert.deepEqual(channel2Payload, {
      channel: 2,
      temperature: 21.8,
      humidity: 55,
      status: 'online',
    });
    assert.equal(channel3.status, 404);
    assert.deepEqual(await channel3.json(), {
      channel: 3,
      status: 'unavailable',
      message: 'No disponible',
    });
  } finally {
    child.kill('SIGTERM');
    await once(child, 'exit').catch(() => undefined);
    await rm(directory, { recursive: true, force: true });
  }
});
