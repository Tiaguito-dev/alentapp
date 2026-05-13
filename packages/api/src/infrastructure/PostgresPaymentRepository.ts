import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import { PaymentRepository, PaymentUpdateData } from '../domain/PaymentRepository.js';
import { PaymentResponse, CreatePaymentRequest } from '@alentapp/shared';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(process.env.DATABASE_URL),
});

type DBPayment = {
  id: string;
  member_id: string;
  amount: number;
  month: number;
  year: number;
  status: 'Pending' | 'Paid' | 'Canceled';
  due_date: Date;
  payment_date: Date | null;
  deleted_at: Date | null;
};

export class PostgresPaymentRepository implements PaymentRepository {
  async create(data: CreatePaymentRequest): Promise<PaymentResponse> {
    const payment = await prisma.payment.create({
      data: {
        member_id: data.member_id,
        amount: data.amount,
        month: data.month,
        year: data.year,
        due_date: new Date(data.due_date),
        status: 'Pending', 
      },
    });
    return this.mapToDTO(payment);
  }

  async findById(id: string): Promise<PaymentResponse | null> {
    // Siempre filtra deleted_at IS NULL (TDD-0014, TDD-0015)
    const payment = await prisma.payment.findFirst({
      where: { id, deleted_at: null },
    });
    return payment ? this.mapToDTO(payment) : null;
  }

  async findAll(): Promise<PaymentResponse[]> {
    const payments = await prisma.payment.findMany({
      where: { deleted_at: null },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    return payments.map((p) => this.mapToDTO(p));
  }

  async update(id: string, data: PaymentUpdateData): Promise<PaymentResponse> {
    const payment = await prisma.payment.update({
      where: { id },
      data: {
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.due_date !== undefined && { due_date: new Date(data.due_date) }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.payment_date !== undefined && {
          payment_date: data.payment_date ? new Date(data.payment_date) : null,
        }),
        ...(data.deleted_at !== undefined && { deleted_at: data.deleted_at }),
      },
    });
    return this.mapToDTO(payment);
  }

  // TDD-0012: status != 'Canceled' AND deleted_at IS NULL
  async existsActiveForPeriod(
    member_id: string,
    month: number,
    year: number,
  ): Promise<boolean> {
    const payment = await prisma.payment.findFirst({
      where: {
        member_id,
        month,
        year,
        status: { not: 'Canceled' },
        deleted_at: null,
      },
    });
    return payment !== null;
  }

  private mapToDTO(payment: DBPayment): PaymentResponse {
    return {
      id: payment.id,
      member_id: payment.member_id,
      amount: payment.amount,
      month: payment.month,
      year: payment.year,
      status: payment.status, // Overdue se calcula en los use cases, nunca en el repo
      due_date: payment.due_date.toISOString().split('T')[0],
      payment_date: payment.payment_date ? payment.payment_date.toISOString() : null,
    };
  }
}