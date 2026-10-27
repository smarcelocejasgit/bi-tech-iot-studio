'use strict';

const { createHash, timingSafeEqual } = require('node:crypto');

const GARDEN_IDENTITY = Object.freeze({
  schoolId: 'escuela-estacion',
  schoolLabel: 'Escuela Estación',
  labId: 'lab-01',
  labLabel: 'Lab 01',
  nodeId: 'garden-node-01',
  nodeLabel: 'Garden Node 01',
});

const LATEST_READING_PATH = [
  'schools',
  GARDEN_IDENTITY.schoolId,
  'labs',
  GARDEN_IDENTITY.labId,
  'nodes',
  GARDEN_IDENTITY.nodeId,
  'latest',
].join('/');

const ALLOWED_ORIGINS = new Set([
  'https://iotstudio.web.app',
  'http://127.0.0.1:5000',
  'http://localhost:5000',
]);

function sha256Hex(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function extractBearerToken(authorizationHeader) {
  if (typeof authorizationHeader !== 'string') return null;
  const match = authorizationHeader.match(/^Bearer\s+([^\s]+)$/i);
  return match ? match[1] : null;
}

function isValidToken(authorizationHeader, expectedHash) {
  const token = extractBearerToken(authorizationHeader);
  if (!token || token.length < 16 || token.length > 512) return false;
  if (!/^[a-f0-9]{64}$/i.test(expectedHash || '')) return false;

  const received = Buffer.from(sha256Hex(token), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return received.length === expected.length && timingSafeEqual(received, expected);
}

function validateTelemetryPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false, message: 'El cuerpo debe ser un objeto JSON.' };
  }

  const { temperature, humidity, status } = payload;
  if (
    typeof temperature !== 'number' ||
    !Number.isFinite(temperature) ||
    temperature < -20 ||
    temperature > 80
  ) {
    return { ok: false, message: 'temperature fuera de rango.' };
  }
  if (
    typeof humidity !== 'number' ||
    !Number.isFinite(humidity) ||
    humidity < 0 ||
    humidity > 100
  ) {
    return { ok: false, message: 'humidity fuera de rango.' };
  }
  if (status !== 'online') {
    return { ok: false, message: 'status debe ser online.' };
  }

  return { ok: true, value: { temperature, humidity, status } };
}

function resolveOperation(rawPath) {
  const normalized = String(rawPath || '')
    .split('?')[0]
    .replace(/\/+$/, '');
  if (normalized.endsWith('/telemetry')) return 'telemetry';
  if (normalized.endsWith('/latest')) return 'latest';
  return null;
}

function applyHttpHeaders(req, res) {
  const origin = req.get?.('origin') || req.headers?.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
  }
  res.set('Cache-Control', 'no-store');
  res.set('X-Content-Type-Options', 'nosniff');
}

function createTelemetryHandler({ repository, getExpectedTokenHash, now = Date.now }) {
  return async function telemetryHandler(req, res) {
    applyHttpHeaders(req, res);

    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.status(204).send('');
      return;
    }

    const operation = resolveOperation(req.path || req.url);
    if (!operation) {
      res.status(404).json({ error: 'Ruta no encontrada.' });
      return;
    }

    if (operation === 'telemetry') {
      if (req.method !== 'POST') {
        res.set('Allow', 'POST, OPTIONS');
        res.status(405).json({ error: 'Método no permitido.' });
        return;
      }

      const bearer = extractBearerToken(req.get?.('authorization'));
      if (!bearer) {
        res.status(401).json({ error: 'Token requerido.' });
        return;
      }

      const expectedHash = getExpectedTokenHash();
      if (!/^[a-f0-9]{64}$/i.test(expectedHash || '')) {
        res.status(503).json({ error: 'Servicio sin credencial configurada.' });
        return;
      }
      if (!isValidToken(`Bearer ${bearer}`, expectedHash)) {
        res.status(403).json({ error: 'Token inválido.' });
        return;
      }

      const validation = validateTelemetryPayload(req.body);
      if (!validation.ok) {
        res.status(422).json({ error: validation.message });
        return;
      }

      const reading = {
        schemaVersion: 1,
        ...validation.value,
        timestamp: now(),
      };
      await repository.writeLatest(reading);

      res.status(200).json({
        ok: true,
        identity: GARDEN_IDENTITY,
        telemetry: reading,
      });
      return;
    }

    if (req.method !== 'GET') {
      res.set('Allow', 'GET, OPTIONS');
      res.status(405).json({ error: 'Método no permitido.' });
      return;
    }

    const reading = await repository.readLatest();
    if (!reading) {
      res.status(404).json({ error: 'Todavía no hay telemetría real.' });
      return;
    }

    res.status(200).json({
      identity: GARDEN_IDENTITY,
      telemetry: {
        temperature: reading.temperature,
        humidity: reading.humidity,
        status: reading.status,
        timestamp: reading.timestamp,
      },
    });
  };
}

module.exports = {
  GARDEN_IDENTITY,
  LATEST_READING_PATH,
  createTelemetryHandler,
  extractBearerToken,
  isValidToken,
  resolveOperation,
  sha256Hex,
  validateTelemetryPayload,
};
