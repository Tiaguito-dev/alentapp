import { PaymentRepository } from '../../domain/PaymentRepository.js';
import { PaymentResponse } from '@alentapp/shared';

export class GetPaymentByIdUseCase {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async execute(id: string): Promise<PaymentResponse> {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new Error('El pago no existe');
    }
    return this.resolveStatus(payment);
  }

  private resolveStatus(payment: PaymentResponse): PaymentResponse {
    if (payment.status === 'Pending') {
      const dueDate = new Date(payment.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dueDate < today) {
        return { ...payment, status: 'Overdue' };
      }
    }
    return payment;
  }
}