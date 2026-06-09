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
 *
 * Cada test es independiente: crea su propio estado y no depende de otros tests.
 * Cada test usa un mes distinto para evitar conflictos de pago duplicado activo.
 */

test.describe('Payments Full-Stack E2E', () => {

    test.beforeEach(async ({ page }) => {
        // Aseguramos que exista un socio antes de cada test
        await page.goto('/members');
        const noMembers = await page.getByText('No se encontraron miembros.').isVisible();
        if (noMembers) {
            await page.locator('button:has-text("Agregar Miembro")').click();
            await page.getByPlaceholder('Ej. Juan Pérez').fill('Socio E2E Pagos');
            await page.getByPlaceholder('Ej. 12345678').fill('99988877');
            await page.getByPlaceholder('ejemplo@correo.com').fill('pagos@e2e.com');
            await page.getByLabel(/Fecha de Nacimiento/i).fill('1990-01-01');
            await page.getByRole('button', { name: 'Crear Miembro' }).click();
            await expect(page.getByRole('button', { name: 'Crear Miembro' })).toBeHidden();
        }
    });

    test('debe mostrar el estado vacío cuando no hay pagos en la DB', async ({ page }) => {
        await page.goto('/payments');
        await expect(page.getByText('No se encontraron pagos.')).toBeVisible({ timeout: 10000 });
    });

    test('debe crear un pago real y mostrarlo en la tabla', async ({ page }) => {
        await page.goto('/payments');

        await page.locator('button:has-text("Nuevo Pago")').click();
        await expect(page.getByRole('heading', { name: 'Nuevo Pago' })).toBeVisible();

        const currentYear = new Date().getFullYear().toString();

        await page.getByPlaceholder('Ej. 5000').fill('1500');
        await page.locator('input[placeholder="1-12"]').fill('12');
        await page.locator(`input[placeholder="${currentYear}"]`).fill(currentYear);
        await page.locator('input[type="date"]').fill(`${currentYear}-12-31`);

        await page.getByRole('button', { name: 'Crear Pago' }).click();
        await expect(page.getByRole('heading', { name: 'Nuevo Pago' })).toBeHidden({ timeout: 10000 });
        await expect(page.getByText('1.500')).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('Pendiente')).toBeVisible({ timeout: 10000 });
    });

    test('debe marcar un pago como pagado y ver el cambio de estado en la tabla', async ({ page }) => {
        await page.goto('/payments');

        await page.locator('button:has-text("Nuevo Pago")').click();
        await expect(page.getByRole('heading', { name: 'Nuevo Pago' })).toBeVisible();

        const currentYear = new Date().getFullYear().toString();

        await page.getByPlaceholder('Ej. 5000').fill('3000');
        await page.locator('input[placeholder="1-12"]').fill('11');
        await page.locator(`input[placeholder="${currentYear}"]`).fill(currentYear);
        await page.locator('input[type="date"]').fill(`${currentYear}-11-30`);

        await page.getByRole('button', { name: 'Crear Pago' }).click();
        await expect(page.getByRole('heading', { name: 'Nuevo Pago' })).toBeHidden({ timeout: 10000 });
        await expect(page.getByText('3.000')).toBeVisible({ timeout: 10000 });

        // Marcar como pagado
        await page.getByRole('button', { name: /Marcar como pagado/i }).first().click();
        await expect(page.getByRole('heading', { name: 'Registrar Pago' })).toBeVisible();
        await page.getByRole('button', { name: 'Confirmar Pago' }).click();
        await expect(page.getByRole('heading', { name: 'Registrar Pago' })).toBeHidden({ timeout: 10000 });
        await expect(page.getByText('Pagado')).toBeVisible({ timeout: 10000 });
    });

    test('debe eliminar un pago y verificar que desaparece de la tabla', async ({ page }) => {
        await page.goto('/payments');

        page.on('dialog', (dialog) => dialog.accept());

        await page.locator('button:has-text("Nuevo Pago")').click();
        await expect(page.getByRole('heading', { name: 'Nuevo Pago' })).toBeVisible();

        const currentYear = new Date().getFullYear().toString();

        await page.getByPlaceholder('Ej. 5000').fill('2000');
        await page.locator('input[placeholder="1-12"]').fill('3');
        await page.locator(`input[placeholder="${currentYear}"]`).fill(currentYear);
        await page.locator('input[type="date"]').fill(`${currentYear}-03-31`);

        await page.getByRole('button', { name: 'Crear Pago' }).click();
        await expect(page.getByRole('heading', { name: 'Nuevo Pago' })).toBeHidden({ timeout: 10000 });
        await expect(page.getByText('2.000')).toBeVisible({ timeout: 10000 });

        // Eliminar el pago
        await page.getByRole('row').filter({ hasText: '2.000' }).getByRole('button', { name: /Eliminar/i }).click();
        await expect(page.getByText('2.000')).toBeHidden({ timeout: 10000 });
    });
});