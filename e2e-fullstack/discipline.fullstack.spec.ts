import { test, expect } from '@playwright/test';

test.describe.serial('Disciplines Full-Stack E2E', () => {

  
  test('debe mostrar el estado vacío cuando no hay sanciones en la DB', async ({ page }) => {
    await page.goto('/disciplines');
    await expect(page.getByText('No se encontraron sanciones.')).toBeVisible({ timeout: 10000 });
  });

  
  test('debe crear una sanción real y mostrarla en la tabla', async ({ page }) => {
    
    await page.goto('/members');
    await page.locator('button:has-text("Agregar Miembro")').click();
    await page.getByPlaceholder('Ej. Juan Pérez').fill('Socio E2E Sanciones');
    await page.getByPlaceholder('Ej. 12345678').fill('55544433');
    await page.getByPlaceholder('ejemplo@correo.com').fill('sanciones@e2e.com');
    await page.getByLabel(/Fecha de Nacimiento/i).fill('1990-01-01');
    await page.getByRole('button', { name: 'Crear Miembro' }).click();
    await expect(page.getByRole('button', { name: 'Crear Miembro' })).toBeHidden();

    
    await page.goto('/disciplines');
    
    
    await page.getByRole('button', { name: 'Nueva Sanción' }).click();
    
    
    await page.getByLabel(/Nombre del Incidente/i).fill('Falta Grave E2E'); 
    await page.getByLabel(/Descripción/i).fill('Comportamiento inadecuado en el establecimiento');
    
    
    await page.getByText('Seleccione un socio').click();
    
    
    const primeraOpcion = page.getByRole('option').first();
    await primeraOpcion.waitFor({ state: 'visible', timeout: 5000 });
    await primeraOpcion.click();

    
    await page.getByLabel(/Fecha de Inicio/i).fill('2026-06-01');
    await page.getByLabel(/Fecha de Fin/i).fill('2026-06-10');
    
    
    await page.getByRole('button', { name: 'Aplicar Sanción' }).click();

    
    await expect(page.getByRole('button', { name: 'Aplicar Sanción' })).toBeHidden({ timeout: 5000 });

    
    const filaNueva = page.getByRole('row', { name: 'Falta Grave E2E' });
    await expect(filaNueva.getByText('Falta Grave E2E')).toBeVisible({ timeout: 10000 });
  });

  
  test('debe editar la fecha de fin de la sanción exitosamente', async ({ page }) => {
    await page.goto('/disciplines');

    const fila = page.getByRole('row', { name: 'Falta Grave E2E' });
    await fila.getByRole('button', { name: 'Editar sanción' }).click();
    
    
    await page.getByLabel(/Fecha de Fin/i).fill('2026-06-25');
    await page.getByRole('button', { name: 'Guardar Cambios' }).click();

    
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });
    
    
    await expect(fila.getByText('25/06/2026')).toBeVisible({ timeout: 10000 });
  });

  
  test('debe cancelar la edición y no guardar los cambios de fecha', async ({ page }) => {
    await page.goto('/disciplines');

    const fila = page.getByRole('row', { name: 'Falta Grave E2E' });
    await fila.getByRole('button', { name: 'Editar sanción' }).click();

    
    await page.getByLabel(/Fecha de Fin/i).fill('2026-06-30');
    await page.getByRole('button', { name: 'Cancelar' }).click();

    
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(fila.getByText('30/06/2026')).toBeHidden();
    
    
    await expect(fila.getByText('25/06/2026')).toBeVisible();
  });

});