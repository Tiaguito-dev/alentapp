import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListPaymentsUseCase } from './ListPaymentsUseCase.js';
import { PaymentRepository } from '../../domain/PaymentRepository.js';
import { PaymentResponse } from '@alentapp/shared';

describe('ListPaymentsUseCase', () => {
    const mockPaymentRepo = {
        findAll: vi.fn(),
    } as unknown as PaymentRepository;

    const useCase = new ListPaymentsUseCase(mockPaymentRepo);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe retornar la lista de pagos', async () => {
        const mockPayments: PaymentResponse[] = [
            { id: '1', member_id: 'member-1', amount: 1500, month: 5, year: 2026, status: 'Pending', due_date: '2026-05-31', payment_date: null },
        ];
        vi.mocked(mockPaymentRepo.findAll).mockResolvedValueOnce(mockPayments);

        const result = await useCase.execute();

        expect(result).toHaveLength(1);
        expect(mockPaymentRepo.findAll).toHaveBeenCalledOnce();
    });

    it('debe resolver el status Overdue para pagos Pending vencidos', async () => {
        const mockPayments: PaymentResponse[] = [
            { id: '1', member_id: 'member-1', amount: 1500, month: 1, year: 2025, status: 'Pending', due_date: '2025-01-31', payment_date: null },
        ];
        vi.mocked(mockPaymentRepo.findAll).mockResolvedValueOnce(mockPayments);

        const result = await useCase.execute();

        expect(result[0].status).toBe('Overdue');
    });
});