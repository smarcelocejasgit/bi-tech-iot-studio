'use strict';

const { getApps, initializeApp } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const {
  LATEST_READING_PATH,
  createTelemetryHandler,
} = require('./lib/telemetry');

if (getApps().length === 0) {
  initializeApp();
}

const gardenNodeTokenHash = defineSecret('GARDEN_NODE_TOKEN_SHA256');

const repository = {
  async writeLatest(reading) {
    await getDatabase().ref(LATEST_READING_PATH).set(reading);
  },
  async readLatest() {
    const snapshot = await getDatabase().ref(LATEST_READING_PATH).get();
    return snapshot.exists() ? snapshot.val() : null;
  },
};

const handler = createTelemetryHandler({
  repository,
  getExpectedTokenHash: () => gardenNodeTokenHash.value(),
});

exports.gardenTelemetry = onRequest(
  {
    region: 'southamerica-east1',
    maxInstances: 2,
    secrets: [gardenNodeTokenHash],
  },
  handler
);
