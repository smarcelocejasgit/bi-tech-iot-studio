import { expect, test } from 'playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/studio');
  await expect(page.getByTestId('program-mode-view')).toBeVisible();
  await page.getByLabel('Limpiar bloques').click();
  await expect(page.locator('.blocklyBlockCanvas .blocklyDraggable')).toHaveCount(0);
});

test('la Guía del proyecto acompaña Garden Node y vuelve a Blockly sin perder el programa', async ({
  page,
}) => {
  await page.getByTestId('insert-block-bitech_wait').click();
  await expect(page.locator('.blocklyBlockCanvas .blocklyDraggable')).toHaveCount(1);

  await page.getByTestId('open-project-guide').click();
  await expect(page.getByTestId('project-guide-drawer')).toBeVisible();
  await expect(page.getByTestId('guide-project-step')).toContainText(
    'Garden Node Bi-Tech — ESP32'
  );
  await page
    .getByRole('button', {
      name: 'Abrir vista general de Garden Node Bi-Tech — ESP32',
    })
    .click();
  await expect(
    page.getByTestId('guide-resource-viewer').getByRole('img', {
      name: 'Vista pedagógica de Garden Node Bi-Tech — ESP32',
    })
  ).toBeVisible();
  await page.keyboard.press('Escape');

  await page.getByTestId('guide-step-2').click();
  await expect(page.getByTestId('guide-component-dht11')).toBeVisible();
  await expect(page.getByTestId('guide-component-pump')).toBeVisible();
  await expect(page.getByTestId('guide-component-ov3660')).toHaveCount(0);

  const dhtOpenButton = page
    .getByTestId('guide-component-dht11')
    .getByRole('button', { name: 'Ver ficha' });
  await dhtOpenButton.click();
  await expect(page.getByTestId('guide-resource-viewer')).toBeVisible();
  await expect(
    page.getByRole('img', { name: 'Lámina didáctica del componente DHT11' })
  ).toBeVisible();
  await expect(page.getByText('Garden Node', { exact: true })).toBeVisible();
  await expect(page.getByText('Produce temperatura en °C y humedad relativa en %.')).toBeVisible();
  await page.getByRole('button', { name: 'Abrir lámina en grande' }).click();
  await expect(page.getByRole('button', { name: 'Reducir lámina' })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar lámina' }).click();
  await expect(dhtOpenButton).toBeFocused();

  await page.getByTestId('guide-step-3').click();
  const dhtConnection = page.getByTestId(
    'guide-connection-garden-dht11-gpio21'
  );
  await expect(
    page.getByTestId('guide-connection-garden-energy-system')
  ).toBeVisible();
  await expect(dhtConnection).toContainText('Pendiente de validación física');
  await dhtConnection.getByRole('button', { name: 'Abrir lámina' }).click();
  await expect(
    page.getByRole('img', {
      name: 'Diagrama de conexiones: Garden Node — conexiones completas',
    })
  ).toBeVisible();
  await expect(page.getByText('DATA / S → GPIO digital disponible')).toBeVisible();
  await expect(
    page.getByText('DHT11: conexión validada en Smart Garden Lab con DATA en GPIO21.')
  ).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar lámina' }).click();

  await page.getByTestId('guide-step-4').click();
  await page.getByRole('button', { name: 'Riego automático' }).click();
  await expect(page.getByTestId('guide-algorithm-step')).toContainText(
    'leer humedad'
  );
  await expect(page.getByTestId('guide-algorithm-step')).toContainText(
    'si humedad < umbral'
  );
  await page
    .getByRole('button', {
      name: 'Abrir lámina del algoritmo Riego automático',
    })
    .click();
  await expect(
    page.getByRole('img', { name: 'Lámina del algoritmo Riego automático' })
  ).toBeVisible();
  const algorithmViewer = page.getByTestId('guide-resource-viewer');
  await expect(
    algorithmViewer.getByRole('heading', { name: 'Pseudocódigo sencillo' })
  ).toBeVisible();
  await expect(algorithmViewer.getByText('Relación con Blockly')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('guide-resource-viewer')).toHaveCount(0);

  await page.getByTestId('guide-step-5').click();
  await page.getByTestId('guide-go-program').click();
  await expect(page.getByTestId('project-guide-drawer')).toHaveCount(0);
  await expect(page.getByTestId('program-mode-view')).toBeVisible();
  await expect(page.locator('.blocklyBlockCanvas .blocklyDraggable')).toHaveCount(1);
});

test('la Guía del proyecto filtra componentes para Camera Node', async ({
  page,
}) => {
  await page.getByTestId('select-camera-node').click();
  await page.getByTestId('open-project-guide').click();
  await page.getByTestId('guide-step-2').click();

  await expect(page.getByTestId('guide-component-esp32-cam')).toBeVisible();
  await expect(page.getByTestId('guide-component-ov2640')).toBeVisible();
  await expect(page.getByTestId('guide-component-ov3660')).toBeVisible();
  await expect(page.getByTestId('guide-component-wifi')).toBeVisible();
  await expect(page.getByTestId('guide-component-pump')).toHaveCount(0);

  await page.getByTestId('guide-step-3').click();
  const cameraConnection = page.getByTestId('guide-connection-camera-module');
  await expect(cameraConnection).toContainText(
    'Camera Node — conexiones completas'
  );
  await cameraConnection.getByRole('button', { name: 'Abrir lámina' }).click();
  await expect(
    page.getByTestId('guide-resource-viewer').getByRole('img', {
      name: 'Diagrama de conexiones: Camera Node — conexiones completas',
    })
  ).toBeVisible();
});

test('el bloque Wi-Fi edita SSID y protege la contraseña en toda la interfaz', async ({
  page,
}) => {
  const testPassword = 'PASSWORD_E2E_NO_REAL';

  await page.getByTestId('select-camera-node').click();
  await page.getByTestId('insert-block-bitech_cam_wifi').click();
  const wifiBlock = page
    .locator('.blocklyBlockCanvas .blocklyDraggable')
    .filter({ hasText: 'conectar a Wi-Fi' });

  await expect(wifiBlock).toContainText('SSID');
  await expect(wifiBlock).toContainText('Contraseña');
  await expect(wifiBlock).toContainText('••••••••••••');
  await expect(wifiBlock).toContainText('mostrar');

  const editableFields = wifiBlock.locator('.blocklyEditableText');
  await editableFields.nth(0).click();
  const editor = page.locator('.blocklyHtmlInput');
  await expect(editor).toBeVisible();
  await editor.fill('SSID_E2E_AULA');
  await editor.press('Enter');

  await editableFields.nth(1).click();
  await expect(editor).toHaveAttribute('type', 'password');
  await editor.fill(testPassword);
  await editor.press('Enter');

  await expect(wifiBlock).not.toContainText(testPassword);
  await editableFields.nth(2).click();
  await expect(wifiBlock).toContainText(testPassword);
  await editableFields.nth(2).click();
  await expect(wifiBlock).not.toContainText(testPassword);
  await expect(page.getByTestId('interpreter-narrative')).toContainText(
    'Este bloque conecta la placa a la red Wi-Fi indicada para que pueda comunicarse con otros dispositivos o servicios.'
  );
  await expect(page.getByTestId('interpreter-narrative')).not.toContainText(
    testPassword
  );

  await page.getByTestId('tab-view-arduino-code').click();
  await page.getByTestId('tab-compilable-sketch').click();
  await expect(page.getByTestId('arduino-code-display')).toContainText(
    'WIFI_PASSWORD'
  );
  await expect(page.getByTestId('arduino-code-display')).not.toContainText(
    testPassword
  );
  await page.getByTestId('toggle-wifi-credentials').click();
  await expect(page.getByTestId('arduino-code-display')).toContainText(
    testPassword
  );
  await page.getByTestId('toggle-wifi-credentials').click();

  await page.getByTestId('mode-simulate').click();
  await expect(page.getByTestId('simulate-mode-view')).toContainText(
    'Conectando a: SSID_E2E_AULA'
  );
  await expect(page.getByTestId('simulate-mode-view')).not.toContainText(
    testPassword
  );
});

test('los selectores de entrada cambian sus pines con el perfil de hardware', async ({
  page,
}) => {
  await page.getByTestId('category-sensores').click();
  await page.getByTestId('insert-block-bitech_sensor_analog_a0').click();
  const analogBlock = page
    .locator('.blocklyBlockCanvas .blocklyDraggable')
    .filter({ hasText: 'entrada analógica' });
  await analogBlock.click();
  await expect(page.getByTestId('manual-description')).toContainText('GPIO');
  await page.getByTestId('toggle-manual-details-btn').click();
  await expect(page.getByTestId('contextual-manual-panel')).toContainText(
    'No todos los GPIO'
  );
  await expect(analogBlock).toContainText('Elegir GPIO');
  await page.getByTestId('select-nodemcu-esp8266').click();
  await page.getByTestId('mode-board').click();
  await expect(page.getByTestId('board-compile-btn')).toBeDisabled();
  await page.getByTestId('mode-program').click();
  await page.getByTestId('select-garden-node').click();
  await analogBlock.click();
  await analogBlock.locator('.blocklyEditableText').last().click();
  await page
    .locator('.blocklyDropDownDiv .blocklyMenuItemContent')
    .filter({ hasText: 'GPIO34' })
    .click();
  await expect(page.getByTestId('pin-selection-feedback')).toContainText(
    'GPIO34 admite lectura analógica mediante ADC'
  );
  await expect(page.getByTestId('pin-selection-feedback')).toContainText(
    'GPIO34 es sólo entrada'
  );

  await page.getByTestId('category-sensores').click();
  await page.getByTestId('insert-block-bitech_sensor_digital_in').click();
  const digitalBlock = page
    .locator('.blocklyBlockCanvas .blocklyDraggable')
    .filter({ hasText: 'entrada digital' });
  await expect(analogBlock).toContainText('GPIO34');
  await expect(digitalBlock).toContainText('Elegir GPIO');

  await page.getByTestId('select-nodemcu-esp8266').click();
  await expect(analogBlock).toContainText('Elegir GPIO');
  await expect(digitalBlock).toContainText('Elegir GPIO');

  await page.getByTestId('select-camera-node').click();
  await expect(
    page.getByTestId('insert-block-bitech_sensor_analog_a0')
  ).toHaveCount(0);
  await expect(
    page.getByTestId('insert-block-bitech_sensor_digital_in')
  ).toHaveCount(0);
});

test('una entrada IoT conserva el GPIO en intérprete, Arduino y simulador', async ({
  page,
}) => {
  await page.getByTestId('category-iot').click();
  await page.getByTestId('insert-block-bitech_iot_send_event').click();
  const iotBlock = page
    .locator('.blocklyBlockCanvas .blocklyDraggable')
    .filter({ hasText: 'enviar a IoT' });

  await iotBlock.locator('.blocklyEditableText').nth(1).click();
  await page
    .locator('.blocklyDropDownDiv .blocklyMenuItemContent')
    .filter({ hasText: 'entrada analógica' })
    .click();

  await expect(iotBlock).toContainText('Elegir GPIO');
  await iotBlock.locator('.blocklyEditableText').last().click();
  await page
    .locator('.blocklyDropDownDiv .blocklyMenuItemContent')
    .filter({ hasText: 'GPIO34' })
    .click();

  await expect(iotBlock).toContainText('pin');
  await expect(iotBlock).toContainText('GPIO34');
  await expect(page.getByTestId('interpreter-narrative')).toContainText(
    'Elegiste GPIO34, que admite lectura ADC'
  );

  await page.getByTestId('tab-view-arduino-code').click();
  await expect(page.getByTestId('arduino-code-display')).toContainText(
    'pinMode(34, INPUT);'
  );
  await expect(page.getByTestId('arduino-code-display')).toContainText(
    'analogRead(34)'
  );

  await page.getByTestId('mode-simulate').click();
  await expect(page.getByTestId('gpio-input-readings')).toContainText(
    'Entrada analógica · señal analógica · AO GPIO34 · valor'
  );
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
  await page.route('**/v1beta/projects/**:generateContent*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [
          {
            content: {
              role: 'model',
              parts: [
                {
                  text: 'Tu programa espera un tiempo. Revisá el bloque seleccionado para comprender su duración.',
                },
              ],
            },
            finishReason: 'STOP',
          },
        ],
      }),
    });
  });
  const program = page.getByTestId('program-mode-view');
  const widthsBefore = await program
    .locator(':scope > div')
    .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().width));

  await page.getByTestId('assistant-launcher').click();
  await expect(page.getByTestId('assistant-drawer')).toBeVisible();
  await expect(page.getByTestId('bitech-assistant-panel')).toBeVisible();
  await expect(page.getByTestId('assistant-status-badge')).toContainText(
    'IA contextual'
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
  await expect(page.getByTestId('assistant-response')).toContainText(
    'Tu programa espera un tiempo'
  );

  await page.getByTestId('assistant-close-btn').click();
  await expect(page.getByTestId('assistant-drawer')).toHaveCount(0);
  await expect(page.getByTestId('assistant-launcher')).toBeVisible();

  const widthsClosed = await program
    .locator(':scope > div')
    .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().width));
  expect(widthsClosed).toEqual(widthsBefore);
});

test('el asistente falla de forma aislada si el backend no está disponible', async ({
  page,
}) => {
  await page.route('**/v1beta/projects/**:generateContent*', async (route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: { message: 'AI unavailable' } }),
    });
  });

  await page.getByTestId('assistant-launcher').click();
  await page.getByTestId('assistant-input').fill('¿Qué me falta configurar?');
  await page.getByTestId('assistant-send-btn').click();
  await expect(page.getByTestId('assistant-error')).toHaveText(
    'El Asistente Bi-Tech no está disponible en este momento.'
  );
  await expect(page.getByTestId('program-mode-view')).toBeVisible();

  await page.getByTestId('assistant-new-conversation-btn').click();
  await expect(page.getByTestId('assistant-error')).toHaveCount(0);
  await expect(page.getByTestId('assistant-messages-list')).toContainText(
    'No modificaré tus bloques.'
  );
});

test('el asistente conserva conversación para explicar bloque y programa', async ({
  page,
}) => {
  await page.route('**/v1beta/projects/**:generateContent*', async (route) => {
    const requestBody = route.request().postData() ?? '';
    const text = requestBody.includes(
      'PREGUNTA ACTUAL DEL ESTUDIANTE: Explicame mi programa.'
    )
      ? 'Tu programa organiza las acciones de configuración y repetición.'
      : 'Este bloque representa una lectura del componente seleccionado.';
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [
          {
            content: { role: 'model', parts: [{ text }] },
            finishReason: 'STOP',
          },
        ],
      }),
    });
  });

  await page.getByTestId('assistant-launcher').click();
  await page.getByTestId('assistant-input').fill('¿Qué hace este bloque?');
  await page.getByTestId('assistant-send-btn').click();
  await expect(page.getByTestId('assistant-response').last()).toContainText(
    'lectura del componente'
  );

  await page.getByTestId('assistant-input').fill('Explicame mi programa.');
  await page.getByTestId('assistant-send-btn').click();
  await expect(page.getByTestId('assistant-response').last()).toContainText(
    'configuración y repetición'
  );
  await expect(page.getByTestId('assistant-messages-list')).toContainText(
    '¿Qué hace este bloque?'
  );
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
