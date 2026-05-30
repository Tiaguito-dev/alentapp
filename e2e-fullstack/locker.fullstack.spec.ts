import { test, expect } from '@playwright/test';

test('debe crear un casillero real y mostrarlo en la tabla', async ({ page }) => {
  await page.goto('/lockers');
  await page.locator('button:has-text("Agregar Casillero")').click();
  
  await page.getByLabel(/Número de Casillero/i).fill('99'); 
  await page.getByLabel(/Ubicación/i).fill('Vestuario E2E');
  await page.getByRole('button', { name: 'Crear Casillero' }).click();

  
  await expect(page.getByRole('button', { name: 'Crear Casillero' })).toBeHidden({ timeout: 5000 });

 
  await expect(page.getByText('99')).toBeVisible({ timeout: 10000 });
});