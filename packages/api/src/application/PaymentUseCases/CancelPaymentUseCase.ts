import { PaymentRepository } from '../../domain/PaymentRepository.js';
import { PaymentResponse } from '@alentapp/shared';

export class CancelPaymentUseCase {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async execute(id: string): Promise<PaymentResponse> {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new Error('El pago no existe');
    }

    // TDD-0013: un pago cobrado no se puede cancelar
    if (payment.status === 'Paid') {
      throw new Error('No se puede cancelar un pago ya cobrado');
    }

    // TDD-0013: si ya está cancelado, devolver sin cambios (idempotente)
    if (payment.status === 'Canceled') {
      return payment;
    }

    return this.paymentRepository.update(id, { status: 'Canceled' });
  }
}