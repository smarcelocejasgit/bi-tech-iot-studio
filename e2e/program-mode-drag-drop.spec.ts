import { expect, test } from 'playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/studio');
  await expect(page.getByTestId('program-mode-view')).toBeVisible();
  await page.getByLabel('Limpiar bloques').click();
  await expect(page.locator('.blocklyBlockCanvas .blocklyDraggable')).toHaveCount(0);
});

test('el clic de la paleta continúa insertando y seleccionando el bloque', async ({
  page,
}) => {
  await page.getByTestId('insert-block-bitech_wait').click();

  const blocks = page.locator('.blocklyBlockCanvas .blocklyDraggable');
  await expect(blocks).toHaveCount(1);
  await expect(blocks.first()).toContainText('esperar');
  await expect(page.getByTestId('manual-block-preview')).toContainText('esperar');
  await expect(page.getByTestId('didactic-interpreter-view')).toBeVisible();
  await expect(page.getByTestId('interpreter-narrative')).toBeVisible();
  await expect(page.getByTestId('interpreter-step-count')).toHaveText('4 pasos');
  await expect(page.getByTestId('interpreter-pipeline-badges')).toHaveCount(0);
});

test('el bloque de canal vincula Blockly, intérprete y código Arduino', async ({
  page,
}) => {
  await page.getByTestId('category-iot').click();
  await page.getByTestId('insert-block-bitech_iot_connect_channel').click();

  const block = page.locator('.blocklyBlockCanvas .blocklyDraggable');
  await expect(block).toHaveCount(1);
  await expect(block).toContainText('conectar a Smart Garden Lab');
  await expect(block).toContainText('1');
  await expect(page.getByTestId('interpreter-narrative')).toContainText(
    'canal de comunicación 1'
  );
  await expect(page.getByTestId('interpreter-narrative')).toContainText(
    'no funciona como contraseña'
  );

  await page.getByTestId('tab-view-arduino-code').click();
  await expect(page.getByTestId('arduino-code-display')).toContainText(
    'const uint8_t BITECH_CHANNEL = 1;'
  );
  await expect(page.getByTestId('arduino-code-display')).toContainText(
    'conectarSmartGardenLab(BITECH_CHANNEL);'
  );
});

test('arrastrar desde la paleta crea una sola instancia válida en el punto de drop', async ({
  page,
}) => {
  const source = page.getByTestId('insert-block-bitech_wait');
  const dropZone = page.getByTestId('blockly-drop-zone');
  const zoneBox = await dropZone.boundingBox();
  expect(zoneBox).not.toBeNull();

  await source.dragTo(dropZone, {
    targetPosition: {
      x: Math.round(zoneBox!.width * 0.45),
      y: Math.round(zoneBox!.height * 0.42),
    },
  });

  const blocks = page.locator('.blocklyBlockCanvas .blocklyDraggable');
  await expect(blocks).toHaveCount(1);
  await expect(blocks.first()).toContainText('esperar');
  await expect(dropZone).toHaveAttribute('data-drag-over', 'false');

  const initialBlockBox = await blocks.first().boundingBox();
  expect(initialBlockBox).not.toBeNull();
  expect(initialBlockBox!.x).toBeGreaterThanOrEqual(zoneBox!.x - 2);
  expect(initialBlockBox!.y).toBeGreaterThanOrEqual(zoneBox!.y - 2);
  expect(initialBlockBox!.x).toBeLessThan(zoneBox!.x + zoneBox!.width);
  expect(initialBlockBox!.y).toBeLessThan(zoneBox!.y + zoneBox!.height);

  await page.mouse.move(
    initialBlockBox!.x + initialBlockBox!.width / 2,
    initialBlockBox!.y + initialBlockBox!.height / 2
  );
  await page.mouse.down();
  await page.mouse.move(
    initialBlockBox!.x + initialBlockBox!.width / 2 + 80,
    initialBlockBox!.y + initialBlockBox!.height / 2 + 45,
    { steps: 8 }
  );
  await page.mouse.up();

  const movedBlockBox = await blocks.first().boundingBox();
  expect(movedBlockBox).not.toBeNull();
  expect(movedBlockBox!.x).toBeGreaterThan(initialBlockBox!.x + 40);
  await expect(blocks).toHaveCount(1);
  await expect(page.getByTestId('manual-block-preview')).toContainText('esperar');
});

test('Programar prioriza Blockly y mantiene el asistente cerrado como botón flotante', async ({
  page,
}) => {
  const workspaceBox = await page
    .getByTestId('blockly-drop-zone')
    .boundingBox();
  const interpreterBox = await page
    .getByTestId('program-output-panel')
    .boundingBox();

  expect(workspaceBox).not.toBeNull();
  expect(interpreterBox).not.toBeNull();
  expect(workspaceBox!.width).toBeGreaterThan(interpreterBox!.width);
  await expect(page.getByTestId('bitech-assistant-panel')).toHaveCount(0);
  await expect(page.getByTestId('assistant-drawer')).toHaveCount(0);
  await expect(page.getByTestId('assistant-launcher')).toBeVisible();
});

test('el drawer del asistente se superpone sin cambiar la grilla ni bloquear Blockly', async ({
  page,
}) => {
  const program = page.getByTestId('program-mode-view');
  const widthsBefore = await program
    .locator(':scope > div')
    .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().width));

  await page.getByTestId('assistant-launcher').click();
  await expect(page.getByTestId('assistant-drawer')).toBeVisible();
  await expect(page.getByTestId('bitech-assistant-panel')).toBeVisible();
  await expect(page.getByTestId('assistant-status-badge')).toContainText(
    'Asistente en preparación'
  );

  const widthsOpen = await program
    .locator(':scope > div')
    .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().width));
  expect(widthsOpen).toEqual(widthsBefore);

  const source = page.getByTestId('insert-block-bitech_wait');
  const dropZone = page.getByTestId('blockly-drop-zone');
  const zoneBox = await dropZone.boundingBox();
  expect(zoneBox).not.toBeNull();
  await source.dragTo(dropZone, {
    targetPosition: {
      x: Math.round(zoneBox!.width * 0.4),
      y: Math.round(zoneBox!.height * 0.5),
    },
  });
  await expect(page.locator('.blocklyBlockCanvas .blocklyDraggable')).toHaveCount(1);

  await page.getByTestId('assistant-suggestion-0').click();
  await expect(page.getByTestId('assistant-status-response')).toContainText(
    'Asistente en preparación'
  );

  await page.getByTestId('assistant-close-btn').click();
  await expect(page.getByTestId('assistant-drawer')).toHaveCount(0);
  await expect(page.getByTestId('assistant-launcher')).toBeVisible();

  const widthsClosed = await program
    .locator(':scope > div')
    .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().width));
  expect(widthsClosed).toEqual(widthsBefore);
});

test('el modo Placa real conserva su vista independiente', async ({ page }) => {
  await page.getByTestId('mode-board').click();

  await expect(page.getByTestId('board-mode-view')).toBeVisible();
  await expect(page.getByTestId('program-mode-view')).toHaveCount(0);
});

test('Placa real identifica puerto, familia, perfil y FQBN automáticamente', async ({
  page,
}) => {
  let boardConnected = true;
  const portAddress = 'PORT_GARDEN_TEST';
  await page.route('**/api/hardware/ports', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        ports: boardConnected
          ? [
              {
                address: portAddress,
                label: `${portAddress} — Puerto USB (Placa detectada)`,
                protocol: 'serial',
                protocolLabel: 'Serial Port (USB)',
                isUsb: true,
                usbProduct: 'USB-Enhanced-SERIAL CH9102',
                usbManufacturer: 'WCH',
                matchingBoards: [
                  {
                    name: 'ESP32 Dev Module',
                    fqbn: 'esp32:esp32:esp32',
                  },
                ],
                chipModel: 'ESP32-D0WD-V3 (revision v3.0)',
                flashSize: '4 MB',
              },
            ]
          : [],
      }),
    });
  });

  await page.getByTestId('mode-board').click();

  await expect(page.getByTestId('board-detection-panel')).toBeVisible();
  await expect(page.getByTestId('detected-board-family')).toHaveText('ESP32');
  await expect(page.getByTestId('detected-board-port')).toHaveText(
    portAddress
  );
  await expect(page.getByTestId('detected-board-usb-chip')).toHaveText(
    'WCH CH9102'
  );
  await expect(page.getByTestId('detected-board-chip')).toContainText(
    'ESP32-D0WD-V3'
  );
  await expect(page.getByTestId('detected-board-profile')).toHaveText(
    'Garden Node Bi-Tech — ESP32'
  );
  await expect(page.getByTestId('detected-board-fqbn')).toHaveText(
    'esp32:esp32:esp32'
  );
  await expect(page.getByTestId('use-detected-board-btn')).toHaveText(
    'Placa en uso'
  );

  boardConnected = false;
  await page.getByTestId('detect-board-btn').click();
  await expect(page.getByTestId('detected-board-details')).toHaveCount(0);
  await expect(page.getByTestId('board-detection-panel').locator('h2')).toHaveText(
    'No se detectó ninguna placa compatible.'
  );
});

test('un ESP32 genérico exige perfil manual y actualiza el FQBN elegido', async ({
  page,
}) => {
  await page.route('**/api/hardware/ports', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        ports: [
          {
            address: 'PORT_ESP32_AMBIGUOUS_TEST',
            label: 'Puerto USB ESP32 ambiguo',
            protocol: 'serial',
            protocolLabel: 'Serial Port (USB)',
            isUsb: true,
            usbProduct: 'USB Serial Port',
            usbManufacturer: 'FTDI',
            matchingBoards: [],
            chipModel: 'ESP32-D0WD-V3 (revision v3.1)',
            flashSize: null,
          },
        ],
      }),
    });
  });

  await page.getByTestId('mode-board').click();

  await expect(page.getByTestId('board-detection-panel').locator('h2')).toHaveText(
    'Placa ESP32 detectada — seleccioná el perfil'
  );
  await expect(page.getByTestId('manual-detected-profile-select')).toHaveValue(
    ''
  );
  await expect(page.getByTestId('detected-board-fqbn')).toHaveText(
    'Seleccioná un perfil'
  );
  await expect(page.getByTestId('use-detected-board-btn')).toBeDisabled();

  await page
    .getByTestId('manual-detected-profile-select')
    .selectOption('camera-node');
  await expect(page.getByTestId('detected-board-fqbn')).toHaveText(
    'esp32:esp32:esp32cam'
  );

  await page
    .getByTestId('manual-detected-profile-select')
    .selectOption('garden-node');
  await expect(page.getByTestId('detected-board-fqbn')).toHaveText(
    'esp32:esp32:esp32'
  );
});
