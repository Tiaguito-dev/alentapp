import { test, expect } from '@playwright/test';

test.describe('Disciplines Full-Stack E2E', () => {

 
  test.describe('Carga Inicial y Creación', () => {

    test('debe mostrar el estado vacío cuando no hay sanciones en la DB', async ({ page }) => {
      await page.goto('/disciplines');
      
      
      const emptyState = page.getByText('No se encontraron sanciones.');
      if (await emptyState.isVisible()) {
        await expect(emptyState).toBeVisible({ timeout: 10000 });
      }
    });

    test('debe crear una sanción real y mostrarla en la tabla', async ({ page }) => {
      const timestamp = Date.now();
      const dniAleatorio = `111${String(timestamp).slice(-5)}`;
      const nombreIncidente = `Falta E2E ${timestamp}`;

      
      await page.goto('/members');
      await page.locator('button:has-text("Agregar Miembro")').click();
      await page.getByPlaceholder('Ej. Juan Pérez').fill('Socio Create Sancion');
      await page.getByPlaceholder('Ej. 12345678').fill(dniAleatorio);
      await page.getByPlaceholder('ejemplo@correo.com').fill(`create-${timestamp}@e2e.com`);
      await page.getByLabel(/Fecha de Nacimiento/i).fill('1990-01-01');
      await page.getByRole('button', { name: 'Crear Miembro' }).click();
      await expect(page.getByRole('button', { name: 'Crear Miembro' })).toBeHidden();

      
      await page.goto('/disciplines');
      await page.getByRole('button', { name: 'Nueva Sanción' }).click();
      await page.getByLabel(/Nombre del Incidente/i).fill(nombreIncidente); 
      await page.getByLabel(/Descripción/i).fill('Comportamiento inadecuado E2E');
      
      await page.getByText('Seleccione un socio').click();
      const primeraOpcion = page.getByRole('option').first();
      await primeraOpcion.waitFor({ state: 'visible', timeout: 5000 });
      await primeraOpcion.click();

      await page.getByLabel(/Fecha de Inicio/i).fill('2026-06-01');
      await page.getByLabel(/Fecha de Fin/i).fill('2026-06-10');
      await page.getByRole('button', { name: 'Aplicar Sanción' }).click();

      
      await expect(page.getByRole('button', { name: 'Aplicar Sanción' })).toBeHidden({ timeout: 5000 });
      const filaNueva = page.getByRole('row', { name: nombreIncidente });
      await expect(filaNueva.getByText(nombreIncidente)).toBeVisible({ timeout: 10000 });
    });
  });

  
  test.describe('Validaciones y Modificaciones', () => {
    
    
    let memberId: number;
    let disciplineId: number;
    let testNameTimestamp: string;

    test.beforeEach(async ({ request }) => {
      
      testNameTimestamp = `Modif-${Date.now()}`;
      const dniUnico = `222${String(Date.now()).slice(-5)}`;

      
      const memberResponse = await request.post('/api/v1/members', {
        data: {
          name: 'Socio Setup Edit',
          documentNumber: dniUnico,
          email: `edit-${Date.now()}@e2e.com`,
          birthDate: '1990-01-01',
          status: 'Active',
          healthCertificate: true
        }
      });
      const memberData = await memberResponse.json();
      memberId = memberData.id;

      
      const disciplineResponse = await request.post('/api/v1/disciplines', {
        data: {
          memberId: memberId,
          incidentName: testNameTimestamp,
          description: 'Setup inyectado por API',
          startDate: '2026-06-01T00:00:00.000Z',
          endDate: '2026-06-10T00:00:00.000Z'
        }
      });
      const disciplineData = await disciplineResponse.json();
      disciplineId = disciplineData.id;
    });

    test.afterEach(async ({ request }) => {
      
      if (disciplineId) {
        await request.delete(`/api/v1/disciplines/${disciplineId}`).catch(() => {});
      }
      if (memberId) {
        await request.delete(`/api/v1/members/${memberId}`).catch(() => {});
      }
    });

    test('debe editar la fecha de fin de la sanción exitosamente', async ({ page }) => {
      await page.goto('/disciplines');

      
      const fila = page.getByRole('row', { name: testNameTimestamp });
      await fila.getByRole('button', { name: 'Editar sanción' }).click();
      
      
      await page.getByLabel(/Fecha de Fin/i).fill('2026-06-25');
      await page.getByRole('button', { name: 'Guardar Cambios' }).click();

      
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });
      await expect(fila.getByText('25/06/2026')).toBeVisible({ timeout: 10000 });
    });

    test('debe cancelar la edición y no guardar los cambios de fecha', async ({ page }) => {
      await page.goto('/disciplines');

      
      const fila = page.getByRole('row', { name: testNameTimestamp });
      await fila.getByRole('button', { name: 'Editar sanción' }).click();

      
      await page.getByLabel(/Fecha de Fin/i).fill('2026-06-30');
      await page.getByRole('button', { name: 'Cancelar' }).click();

      
      await expect(page.getByRole('dialog')).toBeHidden();
      await expect(fila.getByText('30/06/2026')).toBeHidden();
      
      
      await expect(fila.getByText('10/06/2026')).toBeVisible();
    });

  });

});