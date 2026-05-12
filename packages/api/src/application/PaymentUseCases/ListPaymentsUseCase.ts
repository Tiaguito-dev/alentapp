import { PaymentRepository } from '../../domain/PaymentRepository.js';
import { PaymentResponse } from '@alentapp/shared';

export class ListPaymentsUseCase {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async execute(): Promise<PaymentResponse[]> {
    const payments = await this.paymentRepository.findAll();
    // TDD-0015: resolver el status antes de devolver (Pending vencido → Overdue)
    return payments.map((p) => this.resolveStatus(p));
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