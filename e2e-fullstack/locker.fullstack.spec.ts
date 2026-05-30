import { test, expect } from '@playwright/test';


test.describe.serial('Lockers Full-Stack E2E', () => {

  test('debe mostrar el estado vacío cuando no hay casilleros en la DB', async ({ page }) => {
    await page.goto('/lockers');
    await expect(page.getByText('No se encontraron casilleros.')).toBeVisible({ timeout: 10000 });
  });

  test('debe crear un casillero real y mostrarlo en la tabla', async ({ page }) => {
    await page.goto('/lockers');
    
    await page.getByRole('button', { name: 'Agregar Casillero' }).click();
    
    await page.getByLabel(/Número de Casillero/i).fill('99'); 
    await page.getByLabel(/Ubicación/i).fill('Vestuario E2E');
    await page.getByRole('button', { name: 'Crear Casillero' }).click();

    await expect(page.getByRole('button', { name: 'Crear Casillero' })).toBeHidden({ timeout: 5000 });

    const filaNueva = page.getByRole('row', { name: '99' });
    
    
    await expect(filaNueva.getByText(/\b99\b/)).toBeVisible({ timeout: 10000 });
    await expect(filaNueva.getByText('Vestuario E2E')).toBeVisible();
    
    
    await expect(filaNueva.getByText('Disponible')).toBeVisible(); 
  });

  test('debe mostrar error si se intenta crear un casillero con un número que ya existe', async ({ page }) => {
    await page.goto('/lockers');
    
    await page.getByRole('button', { name: 'Agregar Casillero' }).click();
    
    await page.getByLabel(/Número de Casillero/i).fill('99'); 
    await page.getByLabel(/Ubicación/i).fill('Otro Vestuario');
    
    
    page.once('dialog', async (dialog) => {
      
      expect(dialog.message()).toContain('Ya existe Casillero con ese numero');
      await dialog.dismiss();
    });

    
    await page.getByRole('button', { name: 'Crear Casillero' }).click();

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
  });

});