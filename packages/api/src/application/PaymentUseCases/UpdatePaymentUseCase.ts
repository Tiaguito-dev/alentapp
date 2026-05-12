import { PaymentRepository } from '../../domain/PaymentRepository.js';
import { PaymentValidator } from '../../domain/services/PaymentValidator.js';
import { UpdatePaymentRequest, PaymentResponse } from '@alentapp/shared';

export class UpdatePaymentUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentValidator: PaymentValidator,
  ) {}

  async execute(id: string, data: UpdatePaymentRequest): Promise<PaymentResponse> {
    // 1. Buscar pago (null si no existe o está dado de baja)
    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new Error('El pago no existe');
    }

    // 2. Al menos un campo debe venir (TDD-0013)
    if (data.amount === undefined && data.due_date === undefined) {
      throw new Error('Debe proveer al menos un campo a modificar');
    }

    // 3. Solo se puede editar si está Pending (TDD-0013)
    if (payment.status !== 'Pending') {
      throw new Error(`No se puede modificar un pago en estado ${payment.status}`);
    }

    // 4. Validar campos 
    if (data.amount !== undefined) {
      this.paymentValidator.validateAmount(data.amount);
    }
    if (data.due_date !== undefined) {
      this.paymentValidator.validateDueDate(data.due_date);
    }

    return this.paymentRepository.update(id, {
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.due_date !== undefined && { due_date: data.due_date }),
    });
  }
}