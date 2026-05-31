import { test, expect } from '@playwright/test';

// Esto es para que los test se ejecuten en orden, serial.
// Sino se ejecutan en paralelo y van a fallar porque son dependientes.
test.describe.configure({ mode: 'serial' });

test.describe('Sport Full-Stack E2E', () => {

    test('debe mostrar el estado vacio cuando no hay deportes en la DB', async ({ page }) => {
        await page.goto('/sports');
        await expect(page.getByText('No se encontraron deportes.')).toBeVisible({ timeout: 10000 });
    });

    test('debe crear un deporte real y mostrarlo en la tabla', async ({ page }) => {
        await page.goto('/sports');
        await page.getByRole('button', { name: 'Agregar Deporte' }).click();
        await expect(page.getByText('Agregar Nuevo Deporte')).toBeVisible();

        await page.getByLabel('Nombre').fill('Deporte E2E');
        await page.getByLabel('Descripción').fill('Descripción de prueba para el deporte E2E');
        await page.getByLabel('Capacidad Máxima').fill('10');
        await page.getByLabel('Precio Adicional').fill('5');
        await page.getByRole('combobox', { name: '¿Requiere Certificado Médico?' }).click();
        await page.getByRole('option', { name: 'Sí' }).click();

        await page.getByRole('button', { name: 'Crear Deporte' }).click();
        await expect(page.getByRole('button', { name: 'Crear Deporte' })).toBeHidden();
        await expect(page.getByRole('cell', { name: 'Deporte E2E', exact: true })).toBeVisible({ timeout: 10000 });
    });

    test('debe actualizar un deporte real y mostrar los cambios en la tabla', async ({ page }) => {
        await page.goto('/sports');
        await expect(page.getByRole('cell', { name: 'Deporte E2E', exact: true })).toBeVisible({ timeout: 10000 });

        await page.getByRole('row', { name: 'Deporte E2E' }).getByRole('button', { name: 'Editar deporte' }).click();
        await expect(page.getByText('Editar Deporte')).toBeVisible();

        await page.getByLabel('Descripción').clear();
        await page.getByLabel('Descripción').fill('Descripción de prueba editada para el deporte E2E');
        await page.getByLabel('Capacidad Máxima').clear();
        await page.getByLabel('Capacidad Máxima').fill('20');
        await page.getByLabel('Precio Adicional').clear();
        await page.getByLabel('Precio Adicional').fill('10');
        await page.getByRole('combobox', { name: '¿Requiere Certificado Médico?' }).click();
        await page.getByRole('option', { name: 'No' }).click();

        await page.getByRole('button', { name: 'Guardar Cambios' }).click();
        await expect(page.getByText('Descripción de prueba editada para el deporte E2E')).toBeVisible();
        await expect(page.getByText('$10')).toBeVisible();
        await expect(page.getByText('No requerido')).toBeVisible();
    });

    test('debe borrar el deporte creado en los test de create y update', async ({ page }) => {
        await page.goto('/sports');
        await expect(page.getByRole('cell', { name: 'Deporte E2E', exact: true })).toBeVisible({ timeout: 10000 });

        page.on('dialog', (dialog) => dialog.accept());
        await page.getByRole('row', { name: 'Deporte E2E' }).getByRole('button', { name: 'Eliminar deporte' }).click();
        await expect(page.getByText('No se encontraron deportes.')).toBeVisible({ timeout: 10000 });
    });
});