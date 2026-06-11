import { test, expect, type Page } from '@playwright/test';

test.describe('Medical Certificates Full-Stack E2E', () => {

    const uniqueId = () => `${Date.now()}${Math.floor(Math.random() * 1000)}`;

    async function createMember(page: Page, suffix: string) {
        await page.goto('/members');
        await page.locator('button:has-text("Agregar Miembro")').click();
        await page.getByPlaceholder('Ej. Juan Pérez').fill(`Socio E2E Certificados ${suffix}`);
        await page.getByPlaceholder('Ej. 12345678').fill(`88${suffix.slice(-6)}`);
        await page.getByPlaceholder('ejemplo@correo.com').fill(`certificados.${suffix}@e2e.com`);
        await page.getByLabel(/Fecha de Nacimiento/i).fill('1992-02-02');
        await page.getByRole('button', { name: 'Crear Miembro' }).click();
        await expect(page.getByRole('button', { name: 'Crear Miembro' })).toBeHidden();
    }

    async function createMedicalCertificate(page: Page, license: string) {
        await page.goto('/medical-certificates');
        await page.locator('button:has-text("Nuevo Certificado")').click();
        await expect(page.getByRole('heading', { name: 'Nuevo Certificado Médico' })).toBeVisible();

        const currentYear = new Date().getFullYear().toString();
        const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');

        await page.getByLabel('Fecha de emisión').fill(`${currentYear}-${currentMonth}-01`);
        await page.getByLabel('Fecha de vencimiento').fill(`${currentYear}-${currentMonth}-28`);
        await page.getByLabel('Matrícula del médico').fill(license);
        await page.getByRole('button', { name: 'Crear Certificado' }).click();

        await expect(page.getByRole('heading', { name: 'Nuevo Certificado Médico' })).toBeHidden({ timeout: 10000 });
        await expect(page.getByText(license)).toBeVisible({ timeout: 10000 });
    }

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

        // Si hay datos residuales, se dan de baja para asegurar este escenario.
        while (await page.getByRole('button', { name: /Dar de baja/i }).first().isVisible()) {
            await page.getByRole('button', { name: /Dar de baja/i }).first().click();
        }

        await expect(page.getByText('No hay certificados activos.')).toBeVisible({ timeout: 10000 });
    });

    test('debe crear un certificado médico real y mostrarlo en la tabla', async ({ page }) => {
        const suffix = uniqueId();
        const license = `12${suffix.slice(-3)}`;

        await createMember(page, suffix);
        await createMedicalCertificate(page, license);
    });

    test('debe editar un certificado médico y ver el cambio en la tabla', async ({ page }) => {
        const suffix = uniqueId();
        const originalLicense = `34${suffix.slice(-3)}`;
        const updatedLicense = `98${suffix.slice(-3)}`;

        await createMember(page, suffix);
        await createMedicalCertificate(page, originalLicense);

        await page.getByRole('row').filter({ hasText: originalLicense }).getByRole('button', { name: /Editar/i }).click();

        await expect(page.getByRole('heading', { name: 'Editar Certificado Médico' })).toBeVisible();

        await page.getByLabel('Matrícula del médico').fill(updatedLicense);

        await page.getByRole('button', { name: 'Guardar Cambios' }).click();
        await expect(page.getByRole('heading', { name: 'Editar Certificado Médico' })).toBeHidden({ timeout: 10000 });

        await expect(page.getByText(updatedLicense)).toBeVisible({ timeout: 10000 });
    });

    test('debe eliminar un certificado médico y verificar que desaparece de la tabla', async ({ page }) => {
        const suffix = uniqueId();
        const license = `77${suffix.slice(-3)}`;

        await createMember(page, suffix);
        await createMedicalCertificate(page, license);

        await page.getByRole('row').filter({ hasText: license }).getByRole('button', { name: /Dar de baja/i }).click();

        await expect(page.getByText(license)).toBeHidden({ timeout: 10000 });
    });

});
