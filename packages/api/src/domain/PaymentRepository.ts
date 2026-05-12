import { PaymentResponse, CreatePaymentRequest } from '@alentapp/shared';

// incluye campos que no expone la API, por eso no usamos UpdatePaymentRequest
export type PaymentUpdateData = {
  amount?: number;
  due_date?: string;
  status?: 'Pending' | 'Paid' | 'Canceled';
  payment_date?: string | null;
  deleted_at?: Date | null;
};

export interface PaymentRepository {
  create(data: CreatePaymentRequest): Promise<PaymentResponse>;
  findById(id: string): Promise<PaymentResponse | null>;
  findAll(): Promise<PaymentResponse[]>;
  update(id: string, data: PaymentUpdateData): Promise<PaymentResponse>;
  existsActiveForPeriod(member_id: string, month: number, year: number): Promise<boolean>;
}