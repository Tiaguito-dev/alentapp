import { test, expect, request } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

const API_URL = process.env.VITE_API_URL ?? 'http://localhost:3001';

async function crearDeporteAPI() {
    const api = await request.newContext();
    const res = await api.post(`${API_URL}/api/v1/sports`, {
        data: {
            name: 'Deporte E2E',
            description: 'Descripción de prueba para el deporte E2E',
            maxCapacity: 10,
            additionalPrice: 5,
            requiresMedicalCertificate: true,
        },
    });
    const body = await res.json();
    await api.dispose();
    return body.id;
}

async function eliminarDeporteAPI(id: number) {
    const api = await request.newContext();
    await api.delete(`${API_URL}/api/v1/sports/${id}`);
    await api.dispose();
}

test.describe('Sport Full-Stack E2E', () => {
    test('debe mostrar el estado vacío cuando no hay deportes en la DB', async ({ page }) => {
        await page.goto('/sports');
        await expect(page.getByText('No se encontraron deportes.')).toBeVisible({ timeout: 10000 });
    });

    test('debe crear un deporte real y mostrarlo en la tabla', async ({ page }) => {
        // Intercepta la respuesta del POST antes de que ocurra
        const responsePromise = page.waitForResponse(
            res => res.url().includes('/api/v1/sports') && res.request().method() === 'POST'
        );

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

        // Obtiene el id del deporte recién creado desde la respuesta
        const response = await responsePromise;
        const creado = await response.json();

        await expect(page.getByRole('button', { name: 'Crear Deporte' })).toBeHidden();
        await expect(page.getByRole('cell', { name: 'Deporte E2E', exact: true })).toBeVisible({ timeout: 10000 });

        await eliminarDeporteAPI(creado.id);
    });

    test('debe actualizar un deporte real y mostrar los cambios en la tabla', async ({ page }) => {
        const id = await crearDeporteAPI();

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

        await eliminarDeporteAPI(id);
    });

    test('debe borrar un deporte desde la UI', async ({ page }) => {
        await crearDeporteAPI();

        await page.goto('/sports');
        await expect(page.getByRole('cell', { name: 'Deporte E2E', exact: true })).toBeVisible({ timeout: 10000 });
        page.on('dialog', (dialog) => dialog.accept());
        await page.getByRole('row', { name: 'Deporte E2E' }).getByRole('button', { name: 'Eliminar deporte' }).click();
        await expect(page.getByText('No se encontraron deportes.')).toBeVisible({ timeout: 10000 });
    });
});