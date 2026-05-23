import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetPaymentByIdUseCase } from './GetPaymentByIdUseCase.js';
import { PaymentRepository } from '../../domain/PaymentRepository.js';
import { PaymentResponse } from '@alentapp/shared';

describe('GetPaymentByIdUseCase', () => {
    const mockPaymentRepo = {
        findById: vi.fn(),
    } as unknown as PaymentRepository;

    const useCase = new GetPaymentByIdUseCase(mockPaymentRepo);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe retornar el pago si existe', async () => {
        const mockPayment: PaymentResponse = {
            id: 'uuid-pay-1',
            member_id: 'uuid-member-1',
            amount: 1500,
            month: 5,
            year: 2026,
            status: 'Pending',
            due_date: '2026-05-31',
            payment_date: null,
        };
        vi.mocked(mockPaymentRepo.findById).mockResolvedValueOnce(mockPayment);

        const result = await useCase.execute('uuid-pay-1');

        expect(result.id).toBe('uuid-pay-1');
        expect(mockPaymentRepo.findById).toHaveBeenCalledWith('uuid-pay-1');
    });

    it('debe lanzar error si el pago no existe', async () => {
        vi.mocked(mockPaymentRepo.findById).mockResolvedValueOnce(null);

        await expect(useCase.execute('uuid-pay-999'))
            .rejects.toThrow('El pago no existe');
    });

    it('debe resolver el status Overdue para un pago Pending vencido', async () => {
        const mockPayment: PaymentResponse = {
            id: 'uuid-pay-1',
            member_id: 'uuid-member-1',
            amount: 1500,
            month: 1,
            year: 2025,
            status: 'Pending',
            due_date: '2025-01-31',
            payment_date: null,
        };
        vi.mocked(mockPaymentRepo.findById).mockResolvedValueOnce(mockPayment);

        const result = await useCase.execute('uuid-pay-1');

        expect(result.status).toBe('Overdue');
    });
});