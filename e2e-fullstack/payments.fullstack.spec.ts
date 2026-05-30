import { test, expect } from '@playwright/test';

/**
 * Tests E2E Full-Stack para la vista de Pagos.
 * NO hay ningún mock de red. Playwright interactúa con:
 *   - El Frontend React en http://localhost:5174
 *   - La API Fastify real en http://localhost:3001
 *   - La base de datos PostgreSQL de test (alentapp_test_db)
 *
 * El global-setup se encarga de limpiar la DB antes de correr la suite,
 * por lo que cada test empieza desde un estado conocido y limpio.
 */

test.describe('Payments Full-Stack E2E', () => {

    test('debe mostrar el estado vacío cuando no hay pagos en la DB', async ({ page }) => {
        await page.goto('/payments');
        await expect(page.getByText('No se encontraron pagos.')).toBeVisible({ timeout: 10000 });
    });

    test('debe crear un pago real y mostrarlo en la tabla', async ({ page }) => {
        // Primero crear el socio necesario para asignarle un pago
        await page.goto('/members');
        await page.locator('button:has-text("Agregar Miembro")').click();
        await page.getByPlaceholder('Ej. Juan Pérez').fill('Socio E2E Pagos');
        await page.getByPlaceholder('Ej. 12345678').fill('99988877');
        await page.getByPlaceholder('ejemplo@correo.com').fill('pagos@e2e.com');
        await page.getByLabel(/Fecha de Nacimiento/i).fill('1990-01-01');
        await page.getByRole('button', { name: 'Crear Miembro' }).click();
        await expect(page.getByRole('button', { name: 'Crear Miembro' })).toBeHidden();

        // Ahora ir a pagos
        await page.goto('/payments');

        await page.locator('button:has-text("Nuevo Pago")').click();
        await expect(page.getByRole('heading', { name: 'Nuevo Pago' })).toBeVisible();

        const currentYear = new Date().getFullYear().toString();
        const currentMonth = (new Date().getMonth() + 1).toString();

        await page.getByPlaceholder('Ej. 5000').fill('1500');
        await page.locator('input[placeholder="1-12"]').fill(currentMonth);
        await page.locator(`input[placeholder="${currentYear}"]`).fill(currentYear);
        await page.locator('input[type="date"]').fill(`${currentYear}-12-31`);

        await page.getByRole('button', { name: 'Crear Pago' }).click();

        //verifica que el modal de "Crear pago" se cerró
        await expect(page.getByRole('heading', { name: 'Nuevo Pago' })).toBeHidden({ timeout: 10000 });
        
        await expect(page.getByText('1.500')).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('Pendiente')).toBeVisible({ timeout: 10000 });
    });
});