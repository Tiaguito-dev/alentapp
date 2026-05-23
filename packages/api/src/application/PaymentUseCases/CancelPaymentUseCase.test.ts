import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CancelPaymentUseCase } from './CancelPaymentUseCase.js';
import { PaymentRepository } from '../../domain/PaymentRepository.js';
import { PaymentResponse } from '@alentapp/shared';

describe('CancelPaymentUseCase', () => {
    const mockPaymentRepo = {
        findById: vi.fn(),
        update: vi.fn(),
    } as unknown as PaymentRepository;

    const useCase = new CancelPaymentUseCase(mockPaymentRepo);

    const mockExistingPayment: PaymentResponse = {
        id: 'uuid-pay-1',
        member_id: 'uuid-member-1',
        amount: 1500,
        month: 5,
        year: 2026,
        status: 'Pending',
        due_date: '2026-05-31',
        payment_date: null,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe cancelar el pago si está Pending', async () => {
        vi.mocked(mockPaymentRepo.findById).mockResolvedValueOnce(mockExistingPayment);
        vi.mocked(mockPaymentRepo.update).mockResolvedValueOnce({
            ...mockExistingPayment,
            status: 'Canceled',
        });

        const result = await useCase.execute('uuid-pay-1');

        expect(mockPaymentRepo.update).toHaveBeenCalledWith('uuid-pay-1', expect.objectContaining({
            status: 'Canceled',
        }));
        expect(result.status).toBe('Canceled');
    });

    it('debe lanzar error si el pago ya fue cobrado', async () => {
        vi.mocked(mockPaymentRepo.findById).mockResolvedValueOnce({
            ...mockExistingPayment,
            status: 'Paid',
        });

        await expect(useCase.execute('uuid-pay-1'))
            .rejects.toThrow('No se puede cancelar un pago ya cobrado');
        expect(mockPaymentRepo.update).not.toHaveBeenCalled();
    });

    it('debe devolver el pago sin cambios si ya está cancelado', async () => {
        const alreadyCanceled = { ...mockExistingPayment, status: 'Canceled' as const };
        vi.mocked(mockPaymentRepo.findById).mockResolvedValueOnce(alreadyCanceled);

        const result = await useCase.execute('uuid-pay-1');

        expect(mockPaymentRepo.update).not.toHaveBeenCalled();
        expect(result.status).toBe('Canceled');
    });
});