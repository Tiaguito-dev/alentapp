import { test, expect } from '@playwright/test';

test.describe.serial('Medical Certificates Full-Stack E2E', () => {

    test.beforeEach(async ({ page }) => {
        page.on('dialog', dialog => {
            if (dialog.type() === 'alert') {
                throw new Error(`\n🚨 RECHAZADO POR EL BACKEND: ${dialog.message()}\n`);
            } else if (dialog.type() === 'confirm') {
                dialog.accept();
            }
        });
    });

    test('debe mostrar el estado vacío cuando no hay certificados en la DB', async ({ page }) => {
        await page.goto('/medical-certificates');
        await expect(page.getByText('No hay certificados activos.')).toBeVisible({ timeout: 10000 });
    });

    test('debe crear un certificado médico real y mostrarlo en la tabla', async ({ page }) => {
        await page.goto('/members');
        await page.locator('button:has-text("Agregar Miembro")').click();
        await page.getByPlaceholder('Ej. Juan Pérez').fill('Socio E2E Certificados');
        await page.getByPlaceholder('Ej. 12345678').fill('88877766');
        await page.getByPlaceholder('ejemplo@correo.com').fill('certificados@e2e.com');
        await page.getByLabel(/Fecha de Nacimiento/i).fill('1992-02-02');
        await page.getByRole('button', { name: 'Crear Miembro' }).click();
        await expect(page.getByRole('button', { name: 'Crear Miembro' })).toBeHidden();

        await page.goto('/medical-certificates');

        await page.locator('button:has-text("Nuevo Certificado")').click();
        await expect(page.getByRole('heading', { name: 'Nuevo Certificado Médico' })).toBeVisible();

        const currentYear = new Date().getFullYear().toString();
        const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');

        await page.getByLabel('Fecha de emisión').fill(`${currentYear}-${currentMonth}-01`);
        await page.getByLabel('Fecha de vencimiento').fill(`${currentYear}-${currentMonth}-28`);
        
        
        await page.getByLabel('Matrícula del médico').fill('12345');

        await page.getByRole('button', { name: 'Crear Certificado' }).click();

        await expect(page.getByRole('heading', { name: 'Nuevo Certificado Médico' })).toBeHidden({ timeout: 10000 });
        
       
        await expect(page.getByText('12345')).toBeVisible({ timeout: 10000 });
    });

    test('debe editar un certificado médico y ver el cambio en la tabla', async ({ page }) => {
        await page.goto('/medical-certificates');

        await page.getByRole('button', { name: /Editar/i }).first().click();
        await expect(page.getByRole('heading', { name: 'Editar Certificado Médico' })).toBeVisible();

        
        await page.getByLabel('Matrícula del médico').fill('98765');

        await page.getByRole('button', { name: 'Guardar Cambios' }).click();
        await expect(page.getByRole('heading', { name: 'Editar Certificado Médico' })).toBeHidden({ timeout: 10000 });

       
        await expect(page.getByText('98765')).toBeVisible({ timeout: 10000 });
    });

    test('debe eliminar un certificado médico y mostrar el estado vacío', async ({ page }) => {
        await page.goto('/medical-certificates');

       
        await page.getByRole('button', { name: /Dar de baja/i }).first().click();

       
        await expect(page.getByText('98765')).toBeHidden({ timeout: 10000 });
        
        await expect(page.getByText('No hay certificados activos.')).toBeVisible({ timeout: 10000 });
    });

});
