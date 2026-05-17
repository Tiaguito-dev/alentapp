export class DisciplineValidator {
  
  
  validateName(name: string): void {
    if (!name || name.trim() === '') {
      throw new Error('El nombre es obligatorio');
    }
  }

 
  validateDates(startDateStr: string, endDateStr: string): void {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Formato de fecha inválido');
    }

    if (endDate <= startDate) {
      throw new Error('La fecha de fin debe ser mayor a la de inicio');
    }
  }
}