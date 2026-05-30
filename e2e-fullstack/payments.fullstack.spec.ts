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

    test('debe marcar un pago como pagado y ver el cambio de estado en la tabla', async ({ page }) => {
        await page.goto('/payments');

        // El pago del test anterior debe estar en la tabla
        await expect(page.getByText('1.500')).toBeVisible({ timeout: 10000 });

        // Clic en el botón de marcar como pagado
        await page.getByRole('button', { name: /Marcar como pagado/i }).first().click();
        await expect(page.getByRole('heading', { name: 'Registrar Pago' })).toBeVisible();

        // Confirmar sin ingresar fecha 
        await page.getByRole('button', { name: 'Confirmar Pago' }).click();
        await expect(page.getByRole('heading', { name: 'Registrar Pago' })).toBeHidden({ timeout: 10000 });

        // Verificar que el estado cambió a Pagado
        await expect(page.getByText('Pagado')).toBeVisible({ timeout: 10000 });
    });

    test('debe eliminar un pago y mostrar el estado vacío', async ({ page }) => {
        // Crear un pago nuevo en Pending para poder eliminarlo, ya que si está en estado Paid no se puede eliminar
        await page.goto('/payments');

        page.on('dialog', (dialog) => dialog.accept());

        await page.locator('button:has-text("Nuevo Pago")').click();
        await expect(page.getByRole('heading', { name: 'Nuevo Pago' })).toBeVisible();

        const currentYear = new Date().getFullYear().toString();
        const currentMonth = ((new Date().getMonth() + 2) % 12 + 1).toString(); // mes diferente al anterior

        await page.getByPlaceholder('Ej. 5000').fill('2000');
        await page.locator('input[placeholder="1-12"]').fill(currentMonth);
        await page.locator(`input[placeholder="${currentYear}"]`).fill(currentYear);
        await page.locator('input[type="date"]').fill(`${currentYear}-12-31`);

        await page.getByRole('button', { name: 'Crear Pago' }).click();
        await expect(page.getByRole('heading', { name: 'Nuevo Pago' })).toBeHidden({ timeout: 10000 });
        await expect(page.getByText('2.000')).toBeVisible({ timeout: 10000 });

        // Eliminar el pago recién creado
        await page.getByRole('button', { name: /Eliminar/i }).first().click();

        // Verificar que ese pago desapareció
        await expect(page.getByText('2.000')).toBeHidden({ timeout: 10000 });
    });


});