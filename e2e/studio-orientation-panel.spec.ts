import { expect, test } from 'playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/studio');
});

test('el engranaje orienta sobre el Studio y conserva la información técnica', async ({
  page,
}) => {
  const openPanel = page.getByRole('button', {
    name: 'Acerca de Bi-Tech IoT Studio',
  });
  await openPanel.click();

  const panel = page.getByTestId('studio-orientation-panel');
  await expect(panel).toBeVisible();
  await expect(panel).toContainText(
    'Bi-Tech IoT Studio es un entorno educativo para diseñar, programar y comprender sistemas físicos conectados.'
  );
  for (const stage of [
    'Conocer',
    'Conectar',
    'Programar',
    'Comprender',
    'Probar',
    'Observar',
  ]) {
    await expect(panel.getByRole('heading', { name: stage })).toBeVisible();
  }

  const technicalInfo = page.getByTestId('orientation-technical-info');
  await expect(technicalInfo).not.toHaveAttribute('open', '');
  await technicalInfo.getByText('Información técnica').click();
  await expect(technicalInfo).toHaveAttribute('open', '');
  await expect(technicalInfo).toContainText('Capacidades Físicas Reales');

  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
  await expect(openPanel).toBeFocused();
});

test('los accesos reutilizan la Guía del proyecto y Smart Garden Lab', async ({
  page,
}) => {
  await page.getByTestId('open-hardware-modal-btn').click();
  await page.getByTestId('orientation-open-project-guide').click();
  await expect(page.getByTestId('project-guide-drawer')).toBeVisible();
  await page.getByTestId('close-project-guide').click();

  await page.getByTestId('open-hardware-modal-btn').click();
  await page.getByTestId('orientation-open-lab').click();
  await expect(page).toHaveURL(/\/lab$/);
  await expect(page.getByTestId('smart-garden-lab')).toBeVisible();
});
