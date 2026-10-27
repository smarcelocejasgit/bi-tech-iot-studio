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

test('Programar prioriza Blockly y no monta el asistente permanente', async ({
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
});

test('el modo Placa real conserva su vista independiente', async ({ page }) => {
  await page.getByTestId('mode-board').click();

  await expect(page.getByTestId('board-mode-view')).toBeVisible();
  await expect(page.getByTestId('program-mode-view')).toHaveCount(0);
});
