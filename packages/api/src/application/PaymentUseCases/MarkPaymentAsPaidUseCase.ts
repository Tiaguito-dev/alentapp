import { PaymentRepository } from '../../domain/PaymentRepository.js';
import { PaymentValidator } from '../../domain/services/PaymentValidator.js';
import { MarkPaymentAsPaidRequest, PaymentResponse } from '@alentapp/shared';

export class MarkPaymentAsPaidUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentValidator: PaymentValidator,
  ) {}

  async execute(id: string, data: MarkPaymentAsPaidRequest): Promise<PaymentResponse> {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new Error('El pago no existe');
    }

    // TDD-0013: reglas de transición de estado
    if (payment.status === 'Paid') {
      throw new Error('El pago ya fue marcado como pagado');
    }
    if (payment.status === 'Canceled') {
      throw new Error('No se puede marcar como pagado un pago cancelado');
    }

    // Validar payment_date solo si se proveyó
    if (data.payment_date) {
      this.paymentValidator.validatePaymentDate(data.payment_date);
    }

    const payment_date = data.payment_date ?? new Date().toISOString();

    return this.paymentRepository.update(id, {
      status: 'Paid',
      payment_date,
    });
  }
}