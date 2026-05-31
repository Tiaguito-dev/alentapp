import { test, expect } from '@playwright/test';

test.describe('Sport Full-Stack E2E', () => {

    test('debe mostrar el estado vacio cuando no hay deportes en la DB', async ({ page }) => {
        await page.goto('/sports');
        await expect(page.getByText('No se encontraron deportes.')).toBeVisible();
    });

    test('debe crear un deporte real y mostrarlo en la tabla', async ({ page }) => {
        await page.goto('/sports');
        await page.locator('button:has-text("Agregar Deporte")').click();
        await page.getByLabel('Nombre').fill('Deporte E2E');
        await page.getByLabel('Descripción').fill('Descripción de prueba para el deporte E2E');
        await page.getByLabel('Capacidad Máxima').fill('10');
        await page.getByLabel('Precio Adicional').fill('5');
        await page.getByLabel('Requiere certificado médico').check();
        await page.getByRole('button', { name: 'Crear Deporte' }).click();
        await expect(page.getByRole('button', { name: 'Crear Deporte' })).toBeHidden();
        await expect(page.getByText('Deporte E2E')).toBeVisible({ timeout: 10000 });
    });
});