import { expect, test } from 'playwright/test';

test('Firebase AI Logic responde el caso pedagógico real', async ({ page }) => {
  test.setTimeout(150_000);
  test.skip(
    process.env.RUN_FIREBASE_AI_LIVE !== 'true',
    'Prueba real opt-in para evitar costo y dependencia de red en CI.'
  );

  const debugToken = process.env.FIREBASE_APPCHECK_DEBUG_TOKEN;
  test.skip(
    !debugToken,
    'La prueba real requiere un token debug efímero registrado en App Check.'
  );

  await page.addInitScript((token) => {
    (globalThis as typeof globalThis & {
      FIREBASE_APPCHECK_DEBUG_TOKEN?: string;
    }).FIREBASE_APPCHECK_DEBUG_TOKEN = token;
  }, debugToken);

  let firstGeminiRequestBody = '';
  page.on('request', (request) => {
    if (
      !firstGeminiRequestBody &&
      request.url().includes('firebasevertexai.googleapis.com') &&
      request.method() === 'POST'
    ) {
      firstGeminiRequestBody = request.postData() ?? '';
    }
  });

  page.on('pageerror', (error) => {
    console.info('Firebase AI Logic page error:', error.message);
  });

  page.on('response', async (response) => {
    if (
      response.url().includes('firebasevertexai.googleapis.com') &&
      !response.ok()
    ) {
      console.info(
        'Firebase AI Logic error:',
        response.status(),
        await response.text()
      );
    }
  });

  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/studio');
  await expect(page.getByTestId('program-mode-view')).toBeVisible();
  await page.getByLabel('Limpiar bloques').click();
  await page.getByTestId('category-sensores').click();
  await page.getByTestId('insert-block-bitech_sensor_soil').click();
  await page.getByTestId('assistant-launcher').click();
  await page
    .getByTestId('assistant-input')
    .fill('¿Por qué no puedo continuar? Tengo humedad de suelo sin GPIO.');
  await page.getByTestId('assistant-send-btn').click();

  let reply = page.getByTestId('assistant-response').last();
  await expect(reply).toContainText(
    /no pod[eé]s continuar|falta.*seleccionar|seleccionar un pin/i,
    { timeout: 30_000 }
  );
  await expect(reply).toContainText(/GPIO/i);
  await expect(reply).toContainText(/analógic/i);
  await expect(reply).toContainText(/ADC/i);
  await expect(reply).not.toContainText('GPIO34');
  expect(firstGeminiRequestBody).toContain('Garden Node');
  expect(firstGeminiRequestBody).toContain('humedad de suelo');
  expect(firstGeminiRequestBody).toContain('ADC');
  expect(firstGeminiRequestBody).toContain('selectionState');
  expect(firstGeminiRequestBody).not.toMatch(
    /WIFI_PASSWORD|workspaceXml|<xml|void\s+setup|Bearer\s+|192\.168\.\d+\.\d+|"(?:ssid|password|apiKey|token|authorization)"\s*:/i
  );

  for (const question of [
    'Explicame este bloque',
    'Explicame mi programa',
    '¿Qué me falta configurar?',
  ]) {
    const previousReplies = await page
      .getByTestId('assistant-response')
      .count();
    await page.getByTestId('assistant-input').fill(question);
    await page.getByTestId('assistant-send-btn').click();
    await expect(page.getByTestId('assistant-response')).toHaveCount(
      previousReplies + 1,
      { timeout: 30_000 }
    );
    reply = page.getByTestId('assistant-response').last();
    await expect(reply).toContainText(/humedad|sensor|programa|GPIO|ADC/i);
    await expect(reply).not.toContainText('GPIO34');
  }
});
