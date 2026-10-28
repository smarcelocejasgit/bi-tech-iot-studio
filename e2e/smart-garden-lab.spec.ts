import { expect, test } from 'playwright/test';

const ONE_PIXEL_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABAf/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPxB//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPxB//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxB//9k=',
  'base64'
);

test.beforeEach(async ({ page }) => {
  await page.route('**/api/garden/latest', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        identity: {
          schoolId: 'escuela-estacion',
          labId: 'lab-01',
          nodeId: 'garden-node-01',
          nodeLabel: 'Garden Node 01',
        },
        telemetry: {
          temperature: 18.4,
          humidity: 62,
          status: 'online',
          timestamp: 1793059200000,
        },
      }),
    });
  });

  await page.route('http://camera.test/camera/capture*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/jpeg',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: ONE_PIXEL_JPEG,
    });
  });

  await page.route('http://camera.test/camera/stream', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/jpeg',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: ONE_PIXEL_JPEG,
    });
  });

  await page.goto('/lab');
  await expect(page.getByTestId('smart-garden-lab')).toBeVisible();
  await expect(page.getByTestId('env-temperature-value')).toHaveText('18.4');
});

test('En vivo diferencia datos reales, faltantes y estado de cámara', async ({
  page,
}) => {
  await expect(page.getByTestId('lab-live-view')).toBeVisible();
  await expect(page.getByTestId('lab-camera-status')).toContainText('Conectado');
  await expect(page.getByTestId('env-humidity-value')).toHaveText('62');
  await expect(page.getByTestId('env-soil-value')).toHaveText('No disponible');
  await expect(page.getByTestId('env-light-value')).toHaveText('No disponible');
  await expect(page.getByTestId('status-garden-node')).toContainText('Conectado');
  await expect(page.getByTestId('status-sensores')).toContainText(
    'Parcialmente operativos'
  );
});

test('Capturas obtiene una imagen real actual y aclara que no existe historial', async ({
  page,
}) => {
  await page.getByTestId('lab-tab-captures').click();
  await expect(page.getByTestId('lab-captures-view')).toBeVisible();
  await page.getByTestId('lab-capture-now').click();
  await expect(page.getByTestId('lab-current-capture')).toBeVisible();
  await expect(page.getByTestId('lab-capture-timestamp')).toContainText(
    'Capturada el'
  );
  await expect(page.getByText('Historial de capturas aún no disponible.')).toBeVisible();
});

test('Monitorear muestra sólo mediciones reales y variables faltantes', async ({
  page,
}) => {
  await page.getByTestId('lab-tab-monitor').click();
  await expect(page.getByTestId('lab-monitor-view')).toBeVisible();
  await expect(page.getByTestId('monitor-temperature')).toContainText('Real');
  await expect(page.getByTestId('monitor-temperature')).toContainText('18.4');
  await expect(page.getByTestId('monitor-humidity')).toContainText('62');
  await expect(page.getByTestId('monitor-soil')).toContainText('No disponible');
  await expect(page.getByTestId('monitor-light')).toContainText('No disponible');
});

test('Control separa solicitado y confirmado sin ofrecer control ficticio', async ({
  page,
}) => {
  await page.getByTestId('lab-tab-control').click();
  await expect(page.getByTestId('lab-control-view')).toBeVisible();
  await expect(page.getByTestId('control-lighting')).toContainText('Solicitado');
  await expect(page.getByTestId('control-lighting')).toContainText('Confirmado');
  await expect(page.getByTestId('control-pump')).toContainText('No disponible');
  await expect(page.getByText('Control remoto no disponible.')).toBeVisible();
});
