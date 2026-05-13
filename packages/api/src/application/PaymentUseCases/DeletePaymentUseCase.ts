import { PaymentRepository } from '../../domain/PaymentRepository.js';

export class DeletePaymentUseCase {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async execute(id: string): Promise<void> {
    // findById ya filtra deleted_at IS NULL, así que null = no existe O ya dado de baja
    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new Error('El pago no existe');
    }

    // TDD-0014: un pago cobrado no se puede dar de baja
    if (payment.status === 'Paid') {
      throw new Error('No se puede dar de baja un pago ya cobrado');
    }

    // Borrado lógico: setear deleted_at = now() (TDD-0014)
    await this.paymentRepository.update(id, { deleted_at: new Date() });
  }
}