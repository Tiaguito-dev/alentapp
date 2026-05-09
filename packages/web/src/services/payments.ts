import type {
  PaymentResponse,
  CreatePaymentRequest,
  UpdatePaymentRequest,
  MarkPaymentAsPaidRequest,
} from '@alentapp/shared';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/v1';

export const paymentsService = {
  async getAll(): Promise<PaymentResponse[]> {
    const response = await fetch(`${API_URL}/payments`);
    if (!response.ok) throw new Error('Error al obtener los pagos');
    const result = await response.json();
    return result.data;
  },

  async create(data: CreatePaymentRequest): Promise<PaymentResponse> {
    const response = await fetch(`${API_URL}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al crear el pago');
    }
    const result = await response.json();
    return result.data;
  },

  async update(id: string, data: UpdatePaymentRequest): Promise<PaymentResponse> {
    const response = await fetch(`${API_URL}/payments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al actualizar el pago');
    }
    const result = await response.json();
    return result.data;
  },

  async markAsPaid(id: string, data: MarkPaymentAsPaidRequest = {}): Promise<PaymentResponse> {
    const response = await fetch(`${API_URL}/payments/${id}/pay`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al marcar el pago como pagado');
    }
    const result = await response.json();
    return result.data;
  },

  async cancel(id: string): Promise<PaymentResponse> {
    const response = await fetch(`${API_URL}/payments/${id}/cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al cancelar el pago');
    }
    const result = await response.json();
    return result.data;
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/payments/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al eliminar el pago');
    }
  },
};