export class PaymentValidator {
  
  validateAmount(amount: number): void {
    if (amount <= 0) {
      throw new Error('El monto debe ser mayor a cero');
    }
  }

  validatePeriod(month: number, year: number): void {
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new Error('El mes debe estar entre 1 y 12');
    }
    const currentYear = new Date().getFullYear();
    const minYear = currentYear - 1;
    const maxYear = currentYear + 1;
    if (!Number.isInteger(year) || year < minYear || year > maxYear) {
      throw new Error(`El año debe estar entre ${minYear} y ${maxYear}`);
    }
  }

  validateDueDate(due_date: string): void {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(due_date) || isNaN(Date.parse(due_date))) {
      throw new Error('Formato de fecha inválido (esperado YYYY-MM-DD)');
    }
  }

  validatePaymentDate(payment_date: string): void {
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
    if (!dateRegex.test(payment_date) || isNaN(Date.parse(payment_date))) {
      throw new Error('Formato de fecha y hora inválido');
    }
  }
}