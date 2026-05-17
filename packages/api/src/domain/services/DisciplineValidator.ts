export class DisciplineValidator {
  
  validateName(name: string): void {
    if (!name || name.trim() === '') {
      throw new Error('El nombre es obligatorio');
    }
  }

  validateDates(startDateStr: string, endDateStr: string): void {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    // Comprobación de seguridad: ¿Son fechas reales?
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Formato de fecha inválido');
    }

    if (endDate <= startDate) {
      throw new Error('La fecha de fin debe ser mayor a la de inicio');
    }
  }

  /**
   * Valida los datos destinados a una actualización parcial (PATCH).
   */
  validateUpdate(data: { name?: string; startDateStr?: string; endDateStr?: string }): void {
    // 1. Validar nombre si viene en el body
    if (data.name !== undefined) {
      this.validateName(data.name);
    }

    // 2. Si tenemos el set de fechas (combinadas request + db), las extraemos
    if (data.startDateStr && data.endDateStr) {
      const start = new Date(data.startDateStr);
      const end = new Date(data.endDateStr);

      // === AQUÍ ESTÁ LA CORRECCIÓN CLAVE ===
      // Primero nos aseguramos de que los strings realmente representen fechas parseables
      if (isNaN(start.getTime())) {
        throw new Error('Formato de fecha de inicio inválido');
      }
      if (isNaN(end.getTime())) {
        throw new Error('Formato de fecha de fin inválido');
      }

      // Recién cuando estamos 100% seguros de que son válidas, hacemos la comparación cronológica
      if (end <= start) {
        throw new Error('La fecha de fin debe ser mayor a la de inicio');
      }
    }
  }
}