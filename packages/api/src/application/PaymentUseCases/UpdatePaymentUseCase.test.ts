import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdatePaymentUseCase } from './UpdatePaymentUseCase.js';
import { PaymentRepository } from '../../domain/PaymentRepository.js';
import { PaymentValidator } from '../../domain/services/PaymentValidator.js';
import { PaymentResponse } from '@alentapp/shared';

describe('UpdatePaymentUseCase', () => {
    const mockPaymentRepo = {
        findById: vi.fn(),
        update: vi.fn(),
    } as unknown as PaymentRepository;

    const mockPaymentValidator = {
        validateAmount: vi.fn(),
        validateDueDate: vi.fn(),
    } as unknown as PaymentValidator;

    const useCase = new UpdatePaymentUseCase(mockPaymentRepo, mockPaymentValidator);

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

    it('debe actualizar el monto correctamente si el pago está Pending', async () => {
        vi.mocked(mockPaymentRepo.findById).mockResolvedValueOnce(mockExistingPayment);
        vi.mocked(mockPaymentRepo.update).mockResolvedValueOnce({
            ...mockExistingPayment,
            amount: 2000,
        });

        const result = await useCase.execute('uuid-pay-1', { amount: 2000 });

        expect(mockPaymentValidator.validateAmount).toHaveBeenCalledWith(2000);
        expect(mockPaymentRepo.update).toHaveBeenCalledWith('uuid-pay-1', expect.objectContaining({
            amount: 2000,
        }));
        expect(result.amount).toBe(2000);
    });

    it('debe lanzar error si el pago no está en estado Pending', async () => {
        vi.mocked(mockPaymentRepo.findById).mockResolvedValueOnce({
            ...mockExistingPayment,
            status: 'Paid',
        });

        await expect(useCase.execute('uuid-pay-1', { amount: 2000 }))
            .rejects.toThrow('No se puede modificar un pago en estado Paid');
        expect(mockPaymentRepo.update).not.toHaveBeenCalled();
    });

    it('debe lanzar error si no se envía ningún campo a modificar', async () => {
        vi.mocked(mockPaymentRepo.findById).mockResolvedValueOnce(mockExistingPayment);

        await expect(useCase.execute('uuid-pay-1', {}))
            .rejects.toThrow('Debe proveer al menos un campo a modificar');
        expect(mockPaymentRepo.update).not.toHaveBeenCalled();
    });
});