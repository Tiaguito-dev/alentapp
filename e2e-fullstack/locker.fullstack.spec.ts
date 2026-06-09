import { test, expect } from '@playwright/test';

test.describe('Lockers Full-Stack E2E', () => {

  // =========================================================================
  // GRUPO 1: Tests que requieren que el casillero 99 NO exista en la DB
  // =========================================================================
  test.describe('Carga Inicial y Creación', () => {
    
    test.beforeEach(async ({ request }) => {
      // Nos aseguramos de limpiar el casillero 99 antes de cada test de este bloque
      await request.delete('/api/v1/lockers/99').catch(() => {});
    });

    test.afterEach(async ({ request }) => {
      // Dejamos la base de datos limpia al terminar cada prueba
      await request.delete('/api/v1/lockers/99').catch(() => {});
    });

    test('debe mostrar el estado vacío cuando no hay casilleros en la DB', async ({ page }) => {
      await page.goto('/lockers');
      await expect(page.getByText('No se encontraron casilleros.')).toBeVisible({ timeout: 10000 });
    });

    test('debe crear un casillero real y mostrarlo en la tabla', async ({ page }) => {
      await page.goto('/lockers');
      
      await page.getByRole('button', { name: 'Agregar Casillero' }).click();
      
      await page.getByLabel(/Número de Casillero/i).fill('99'); 
      await page.getByLabel(/Ubicación/i).fill('Vestuario E2E');
      await page.getByRole('button', { name: 'Crear Casillero' }).click();

      await expect(page.getByRole('button', { name: 'Crear Casillero' })).toBeHidden({ timeout: 5000 });

      const filaNueva = page.getByRole('row', { name: '99' });
      
      await expect(filaNueva.getByText(/\b99\b/)).toBeVisible({ timeout: 10000 });
      await expect(filaNueva.getByText('Vestuario E2E')).toBeVisible();
      await expect(filaNueva.getByText('Disponible')).toBeVisible(); 
    });
  });

  // =========================================================================
  // GRUPO 2: Tests que requieren que el casillero 100 YA EXISTA en la DB
  // =========================================================================
  test.describe('Validaciones y Modificaciones', () => {

    test.beforeEach(async ({ request }) => {
      // Forzamos un estado conocido: usamos el casillero 100 para no chocar con el Grupo 1
      await request.delete('/api/v1/lockers/100').catch(() => {});
      await request.post('/api/v1/lockers', {
        data: {
          number: 100,
          location: 'Vestuario E2E',
          status: 'Available'
        }
      });
    });

    test.afterEach(async ({ request }) => {
      // Limpieza absoluta al terminar cada prueba de este bloque
      await request.delete('/api/v1/lockers/100').catch(() => {});
    });

    test('debe mostrar error si se intenta crear un casillero con un número que ya existe', async ({ page }) => {
      await page.goto('/lockers');
      
      await page.getByRole('button', { name: 'Agregar Casillero' }).click();
      
      // Intentamos duplicar el 100 que fue creado por el beforeEach
      await page.getByLabel(/Número de Casillero/i).fill('100'); 
      await page.getByLabel(/Ubicación/i).fill('Otro Vestuario');
      
      page.once('dialog', async (dialog) => {
        expect(dialog.message()).toContain('Ya existe Casillero con ese numero');
        await dialog.dismiss();
      });

      await page.getByRole('button', { name: 'Crear Casillero' }).click();

      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    });

    test('debe editar la ubicación del casillero exitosamente', async ({ page }) => {
      await page.goto('/lockers');

      // 1. Buscamos el casillero 100 (creado limpiamente por el beforeEach) y editamos
      const fila = page.getByRole('row', { name: '100' });
      await fila.getByRole('button').first().click();
      
      // 2. Cambiamos solo el texto de la ubicación
      await page.getByLabel(/Ubicación/i).fill('Pasillo Central');
      
      // 3. Guardamos
      await page.getByRole('button', { name: 'Guardar Cambios' }).click();

      // 4. Verificamos que el modal se cierre y el cambio aparezca en la tabla
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });
      await expect(fila.getByText('Pasillo Central')).toBeVisible({ timeout: 10000 });
    });

    test('debe cancelar la edición y no guardar los cambios', async ({ page }) => {
      await page.goto('/lockers');

      // El casillero 100 vuelve a estar en su estado original gracias al beforeEach
      const fila = page.getByRole('row', { name: '100' });
      await fila.getByRole('button').first().click();

      // 1. Escribimos algo por error
      await page.getByLabel(/Ubicación/i).fill('Texto equivocado');
      
      // 2. Nos arrepentimos y hacemos clic en Cancelar
      await page.getByRole('button', { name: 'Cancelar' }).click();

      // 3. Verificamos que el modal se cierre y el texto equivocado NO esté en la tabla
      await expect(page.getByRole('dialog')).toBeHidden();
      await expect(fila.getByText('Texto equivocado')).toBeHidden();
    });
  });

});