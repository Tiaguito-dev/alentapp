import { PaymentRepository } from '../../domain/PaymentRepository.js';
import { PaymentValidator } from '../../domain/services/PaymentValidator.js';
import { MemberRepository } from '../../domain/MemberRepository.js';
import { CreatePaymentRequest, PaymentResponse } from '@alentapp/shared';

export class CreatePaymentUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly memberRepository: MemberRepository,
    private readonly paymentValidator: PaymentValidator,
  ) {}

  async execute(data: CreatePaymentRequest): Promise<PaymentResponse> {
    // 1. Validar campos (TDD-0012)
    this.paymentValidator.validateAmount(data.amount);
    this.paymentValidator.validatePeriod(data.month, data.year);
    this.paymentValidator.validateDueDate(data.due_date);

    // 2. Validar que el socio exista (TDD-0012)
    const member = await this.memberRepository.findById(data.member_id);
    if (!member) {
      throw new Error('El socio especificado no existe');
    }

    // 3. Verificar que no haya un pago activo para el mismo período (TDD-0012)
    const alreadyExists = await this.paymentRepository.existsActiveForPeriod(
      data.member_id,
      data.month,
      data.year,
    );
    if (alreadyExists) {
      throw new Error(`Ya existe un pago activo para este socio en ${data.month}/${data.year}`);
    }

      // 4. Crear con status=Pending, payment_date=null, deleted_at=null (TDD-0012)
    const nuevoPago = await this.paymentRepository.create({
      member_id: data.member_id,
      amount: data.amount,
      month: data.month,
      year: data.year,
      due_date: data.due_date,
    });

    return nuevoPago;
  }
}