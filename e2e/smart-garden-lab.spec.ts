import { expect, Page, test } from 'playwright/test';

const ONE_PIXEL_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABAf/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPxB//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPxB//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxB//9k=',
  'base64'
);

test.beforeEach(async ({ page }) => {
  await page.route('http://camera.test/garden/channel/*/latest', async (route) => {
    const match = new URL(route.request().url()).pathname.match(
      /^\/garden\/channel\/(\d+)\/latest$/
    );
    const channel = Number(match?.[1]);
    const telemetryByChannel: Record<
      number,
      { temperature: number; humidity: number }
    > = {
      1: { temperature: 18.4, humidity: 62 },
      2: { temperature: 21.8, humidity: 55 },
    };
    const telemetry = telemetryByChannel[channel];
    if (!telemetry) {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          channel,
          status: 'unavailable',
          message: 'No disponible',
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        channel,
        ...telemetry,
        status: 'online',
        timestamp: 1793059200000,
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
  await expect(page.getByTestId('lab-channel-connect')).toBeVisible();
});

async function connectChannel(page: Page, channel: number) {
  await page.getByTestId('lab-channel-input').fill(String(channel));
  await page.getByTestId('lab-connect-channel').click();
  await expect(page.getByTestId('lab-channel-status')).toBeVisible();
}

test('selecciona canales 1–9 y mantiene aislados Canal 1 y Canal 2', async ({
  page,
}) => {
  await page.getByTestId('lab-channel-input').fill('10');
  await page.getByTestId('lab-connect-channel').click();
  await expect(page.getByRole('alert')).toHaveText(
    'Ingresá un canal válido del 1 al 9.'
  );

  await page.getByTestId('lab-channel-input').fill('1');
  await page.getByTestId('lab-connect-channel').click();
  await expect(page.getByTestId('lab-channel-status')).toHaveText(
    'Canal 1 — Garden Node 01 conectado'
  );
  await expect(page.getByTestId('env-temperature-value')).toHaveText('18.4');

  await page.getByTestId('lab-change-channel').click();
  await connectChannel(page, 2);
  await expect(page.getByTestId('lab-channel-status')).toHaveText(
    'Canal 2 — Garden Node 02 conectado'
  );
  await expect(page.getByTestId('env-temperature-value')).toHaveText('21.8');
  await expect(page.getByTestId('env-humidity-value')).toHaveText('55');

  await page.getByTestId('lab-change-channel').click();
  await connectChannel(page, 3);
  await expect(page.getByTestId('lab-channel-status')).toHaveText(
    'No se encontró un dispositivo activo en el canal 3.'
  );
  await expect(page.getByTestId('env-temperature-value')).toHaveText(
    'No disponible'
  );
});

test('En vivo diferencia datos reales, faltantes y estado de cámara', async ({
  page,
}) => {
  await connectChannel(page, 1);
  await expect(page.getByTestId('env-temperature-value')).toHaveText('18.4');
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
  await connectChannel(page, 1);
  await page.getByTestId('lab-tab-captures').click();
  await expect(page.getByTestId('lab-captures-view')).toBeVisible();
  await page.getByTestId('lab-capture-now').click();
  await expect(page.getByTestId('lab-current-capture')).toBeVisible();
  await expect(page.getByTestId('lab-capture-timestamp')).toContainText(
    'Capturada el'
  );
  await expect(
    page.getByText('Historial de capturas aún no disponible.')
  ).toBeVisible();
});

test('Monitorear muestra sólo mediciones reales y variables faltantes', async ({
  page,
}) => {
  await connectChannel(page, 1);
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
  await connectChannel(page, 1);
  await page.getByTestId('lab-tab-control').click();
  await expect(page.getByTestId('lab-control-view')).toBeVisible();
  await expect(page.getByTestId('control-lighting')).toContainText('Solicitado');
  await expect(page.getByTestId('control-lighting')).toContainText('Confirmado');
  await expect(page.getByTestId('control-pump')).toContainText('No disponible');
  await expect(page.getByText('Control remoto no disponible.')).toBeVisible();
});
