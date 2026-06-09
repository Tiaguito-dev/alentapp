import { test, expect, request } from '@playwright/test';

const SPORT_PAYLOAD = {
    nombre: 'Deporte e2e',
    descripcion: 'Descripción de prueba para el deporte e2e',
    capacidadMaxima: 10,
    precioAdicional: 5,
    requiereCertificadoMedico: true,
};

async function crearDeporteAPI(baseURL: string): Promise<string> {
    const api = await request.newContext({ baseURL });
    const res = await api.post('/api/sports', { data: SPORT_PAYLOAD });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    await api.dispose();
    return body.id;
}

async function eliminarDeporteAPI(baseURL: string, id: string) {
    const api = await request.newContext({ baseURL });
    await api.delete(`/api/sports/${id}`).catch(() => { });
    await api.dispose();
}

test.describe('Sport Full-Stack e2e', () => {

    // Limpio cualquier deporte e2e que haya quedado huérfano
    test.afterAll(async ({ baseURL }) => {
        const api = await request.newContext({ baseURL: baseURL! });
        const res = await api.get('/api/sports');
        const sports = await res.json();
        for (const s of sports.filter((s: any) => s.nombre === SPORT_PAYLOAD.nombre)) {
            await api.delete(`/api/sports/${s.id}`).catch(() => { });
        }
        await api.dispose();
    });

    test('debe mostrar el estado vacío cuando no hay deportes en la DB', async ({ page }) => {
        await page.goto('/sports');
        await expect(page.getByText('No se encontraron deportes.')).toBeVisible({ timeout: 10000 });
    });

    test('debe crear un deporte real y mostrarlo en la tabla', async ({ page, baseURL }) => {
        try {
            await page.goto('/sports');
            await page.getByRole('button', { name: 'Agregar Deporte' }).click();
            await expect(page.getByText('Agregar Nuevo Deporte')).toBeVisible();

            await page.getByLabel('Nombre').fill(SPORT_PAYLOAD.nombre);
            await page.getByLabel('Descripción').fill(SPORT_PAYLOAD.descripcion);
            await page.getByLabel('Capacidad Máxima').fill(String(SPORT_PAYLOAD.capacidadMaxima));
            await page.getByLabel('Precio Adicional').fill(String(SPORT_PAYLOAD.precioAdicional));
            await page.getByRole('combobox', { name: '¿Requiere Certificado Médico?' }).click();
            await page.getByRole('option', { name: 'Sí' }).click();

            await page.getByRole('button', { name: 'Crear Deporte' }).click();
            await expect(page.getByRole('button', { name: 'Crear Deporte' })).toBeHidden();
            await expect(page.getByRole('cell', { name: SPORT_PAYLOAD.nombre, exact: true })).toBeVisible({ timeout: 10000 });
        } finally {
            // busca por nombre y elimina
            const api = await request.newContext({ baseURL: baseURL! });
            const res = await api.get('/api/sports');
            const sports = await res.json();
            const deporte = sports.find((s: any) => s.nombre === SPORT_PAYLOAD.nombre);
            if (deporte) await api.delete(`/api/sports/${deporte.id}`).catch(() => { });
            await api.dispose();
        }
    });

    test('debe actualizar un deporte real y mostrar los cambios en la tabla', async ({ page, baseURL }) => {
        const id = await crearDeporteAPI(baseURL!);
        try {
            await page.goto('/sports');
            await expect(page.getByRole('cell', { name: SPORT_PAYLOAD.nombre, exact: true })).toBeVisible({ timeout: 10000 });

            await page.getByRole('row', { name: SPORT_PAYLOAD.nombre }).getByRole('button', { name: 'Editar deporte' }).click();
            await expect(page.getByText('Editar Deporte')).toBeVisible();

            await page.getByLabel('Descripción').clear();
            await page.getByLabel('Descripción').fill('Descripción de prueba editada para el deporte e2e');
            await page.getByLabel('Capacidad Máxima').clear();
            await page.getByLabel('Capacidad Máxima').fill('20');
            await page.getByLabel('Precio Adicional').clear();
            await page.getByLabel('Precio Adicional').fill('10');
            await page.getByRole('combobox', { name: '¿Requiere Certificado Médico?' }).click();
            await page.getByRole('option', { name: 'No' }).click();

            await page.getByRole('button', { name: 'Guardar Cambios' }).click();
            await expect(page.getByText('Descripción de prueba editada para el deporte e2e')).toBeVisible();
            await expect(page.getByText('$10')).toBeVisible();
            await expect(page.getByText('No requerido')).toBeVisible();
        } finally {
            await eliminarDeporteAPI(baseURL!, id);
        }
    });

    test('debe borrar un deporte desde la UI', async ({ page, baseURL }) => {
        const id = await crearDeporteAPI(baseURL!);
        try {
            await page.goto('/sports');
            await expect(page.getByRole('cell', { name: SPORT_PAYLOAD.nombre, exact: true })).toBeVisible({ timeout: 10000 });

            page.on('dialog', (dialog) => dialog.accept());
            await page.getByRole('row', { name: SPORT_PAYLOAD.nombre }).getByRole('button', { name: 'Eliminar deporte' }).click();
            await expect(page.getByText('No se encontraron deportes.')).toBeVisible({ timeout: 10000 });
        } finally {
            await eliminarDeporteAPI(baseURL!, id);
        }
    });
});