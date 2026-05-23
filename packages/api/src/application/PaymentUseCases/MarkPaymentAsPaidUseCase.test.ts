import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MarkPaymentAsPaidUseCase } from './MarkPaymentAsPaidUseCase.js';
import { PaymentRepository } from '../../domain/PaymentRepository.js';
import { PaymentValidator } from '../../domain/services/PaymentValidator.js';
import { PaymentResponse } from '@alentapp/shared';

describe('MarkPaymentAsPaidUseCase', () => {
    const mockPaymentRepo = {
        findById: vi.fn(),
        update: vi.fn(),
    } as unknown as PaymentRepository;

    const mockValidator = {
        validatePaymentDate: vi.fn(),
    } as unknown as PaymentValidator;

    const useCase = new MarkPaymentAsPaidUseCase(mockPaymentRepo, mockValidator);

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

    it('debe marcar el pago como pagado y completar payment_date', async () => {
        vi.mocked(mockPaymentRepo.findById).mockResolvedValueOnce(mockExistingPayment);
        vi.mocked(mockPaymentRepo.update).mockResolvedValueOnce({
            ...mockExistingPayment,
            status: 'Paid',
            payment_date: '2026-05-15T10:00:00.000Z',
        });

        const result = await useCase.execute('uuid-pay-1', { payment_date: '2026-05-15T10:00:00.000Z' });

        expect(mockValidator.validatePaymentDate).toHaveBeenCalledWith('2026-05-15T10:00:00.000Z');
        expect(mockPaymentRepo.update).toHaveBeenCalledWith('uuid-pay-1', expect.objectContaining({
            status: 'Paid',
        }));
        expect(result.status).toBe('Paid');
        expect(result.payment_date).not.toBeNull();
    });

    it('debe lanzar error si el pago ya fue cobrado', async () => {
        vi.mocked(mockPaymentRepo.findById).mockResolvedValueOnce({
            ...mockExistingPayment,
            status: 'Paid',
        });

        await expect(useCase.execute('uuid-pay-1', {}))
            .rejects.toThrow('El pago ya fue marcado como pagado');
        expect(mockPaymentRepo.update).not.toHaveBeenCalled();
    });

    it('debe lanzar error si el pago está cancelado', async () => {
        vi.mocked(mockPaymentRepo.findById).mockResolvedValueOnce({
            ...mockExistingPayment,
            status: 'Canceled',
        });

        await expect(useCase.execute('uuid-pay-1', {}))
            .rejects.toThrow('No se puede marcar como pagado un pago cancelado');
        expect(mockPaymentRepo.update).not.toHaveBeenCalled();
    });
});