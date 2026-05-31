import { test, expect } from '@playwright/test';

test.describe.serial('Disciplines Full-Stack E2E', () => {

  // 1. Verificamos el estado vacío inicial
  test('debe mostrar el estado vacío cuando no hay sanciones en la DB', async ({ page }) => {
    await page.goto('/disciplines');
    await expect(page.getByText('No se encontraron sanciones.')).toBeVisible({ timeout: 10000 });
  });

  // 2. CREAMOS el socio y luego la sanción
  test('debe crear una sanción real y mostrarla en la tabla', async ({ page }) => {
    // Paso A: Crear el socio necesario para asignarle la sanción (usando tu referencia)
    await page.goto('/members');
    await page.locator('button:has-text("Agregar Miembro")').click();
    await page.getByPlaceholder('Ej. Juan Pérez').fill('Socio E2E Sanciones');
    await page.getByPlaceholder('Ej. 12345678').fill('55544433');
    await page.getByPlaceholder('ejemplo@correo.com').fill('sanciones@e2e.com');
    await page.getByLabel(/Fecha de Nacimiento/i).fill('1990-01-01');
    await page.getByRole('button', { name: 'Crear Miembro' }).click();
    await expect(page.getByRole('button', { name: 'Crear Miembro' })).toBeHidden();

    // Paso B: Ir a sanciones para crearla
    await page.goto('/disciplines');
    
    // Abrir el modal de sanciones
    await page.getByRole('button', { name: 'Nueva Sanción' }).click();
    
    // Rellenar datos de la sanción
    await page.getByLabel(/Nombre del Incidente/i).fill('Falta Grave E2E'); 
    await page.getByLabel(/Descripción/i).fill('Comportamiento inadecuado en el establecimiento');
    
    // Desplegar el selector de socios de Chakra UI v3
    await page.getByText('Seleccione un socio').click();
    
    // Esperamos a que la opción del socio que acabamos de crear sea visible y hacemos clic
    const primeraOpcion = page.getByRole('option').first();
    await primeraOpcion.waitFor({ state: 'visible', timeout: 5000 });
    await primeraOpcion.click();

    // Rellenar fechas
    await page.getByLabel(/Fecha de Inicio/i).fill('2026-06-01');
    await page.getByLabel(/Fecha de Fin/i).fill('2026-06-10');
    
    // Aplicar la sanción
    await page.getByRole('button', { name: 'Aplicar Sanción' }).click();

    // Verificar que el modal se cierra
    await expect(page.getByRole('button', { name: 'Aplicar Sanción' })).toBeHidden({ timeout: 5000 });

    // Confirmar que aparece en la tabla
    const filaNueva = page.getByRole('row', { name: 'Falta Grave E2E' });
    await expect(filaNueva.getByText('Falta Grave E2E')).toBeVisible({ timeout: 10000 });
  });

  // 3. EDITAMOS la Fecha de Fin de la sanción (Update)
  test('debe editar la fecha de fin de la sanción exitosamente', async ({ page }) => {
    await page.goto('/disciplines');

    const fila = page.getByRole('row', { name: 'Falta Grave E2E' });
    await fila.getByRole('button', { name: 'Editar sanción' }).click();
    
    // Cambiamos la fecha de fin (campo habilitado en tu formulario)
    await page.getByLabel(/Fecha de Fin/i).fill('2026-06-25');
    await page.getByRole('button', { name: 'Guardar Cambios' }).click();

    // Esperar cierre del modal
    await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });
    
    // Tu frontend formatea la fecha usando 'es-AR' -> 25/06/2026
    await expect(fila.getByText('25/06/2026')).toBeVisible({ timeout: 10000 });
  });

  // 4. CANCELAMOS la edición
  test('debe cancelar la edición y no guardar los cambios de fecha', async ({ page }) => {
    await page.goto('/disciplines');

    const fila = page.getByRole('row', { name: 'Falta Grave E2E' });
    await fila.getByRole('button', { name: 'Editar sanción' }).click();

    // Modificamos a una fecha errónea
    await page.getByLabel(/Fecha de Fin/i).fill('2026-06-30');
    await page.getByRole('button', { name: 'Cancelar' }).click();

    // Verificamos que se cierre sin guardar el cambio erróneo (30/06/2026)
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(fila.getByText('30/06/2026')).toBeHidden();
    
    // Mantiene la fecha correcta editada en el Test 3
    await expect(fila.getByText('25/06/2026')).toBeVisible();
  });

});