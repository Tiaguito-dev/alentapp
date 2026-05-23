import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeletePaymentUseCase } from './DeletePaymentUseCase.js';
import { PaymentRepository } from '../../domain/PaymentRepository.js';
import { PaymentResponse } from '@alentapp/shared';

describe('DeletePaymentUseCase', () => {
    const mockPaymentRepo = {
        findById: vi.fn(),
        update: vi.fn(),
    } as unknown as PaymentRepository;

    const useCase = new DeletePaymentUseCase(mockPaymentRepo);

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

    it('debe dar de baja el pago seteando deleted_at si está Pending', async () => {
        vi.mocked(mockPaymentRepo.findById).mockResolvedValueOnce(mockExistingPayment);
        vi.mocked(mockPaymentRepo.update).mockResolvedValueOnce({
            ...mockExistingPayment,
        });

        await useCase.execute('uuid-pay-1');

        expect(mockPaymentRepo.update).toHaveBeenCalledWith('uuid-pay-1', expect.objectContaining({
            deleted_at: expect.any(Date),
        }));
    });

    it('debe lanzar error si el pago no existe', async () => {
        vi.mocked(mockPaymentRepo.findById).mockResolvedValueOnce(null);

        await expect(useCase.execute('uuid-pay-1'))
            .rejects.toThrow('El pago no existe');
        expect(mockPaymentRepo.update).not.toHaveBeenCalled();
    });

    it('debe lanzar error si el pago ya fue cobrado', async () => {
        vi.mocked(mockPaymentRepo.findById).mockResolvedValueOnce({
            ...mockExistingPayment,
            status: 'Paid',
        });

        await expect(useCase.execute('uuid-pay-1'))
            .rejects.toThrow('No se puede dar de baja un pago ya cobrado');
        expect(mockPaymentRepo.update).not.toHaveBeenCalled();
    });
});