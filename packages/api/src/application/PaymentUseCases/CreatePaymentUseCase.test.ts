import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreatePaymentUseCase } from './CreatePaymentUseCase.js';
import { PaymentRepository } from '../../domain/PaymentRepository.js';
import { MemberRepository } from '../../domain/MemberRepository.js';
import { PaymentValidator } from '../../domain/services/PaymentValidator.js';
import { CreatePaymentRequest } from '@alentapp/shared';

describe('CreatePaymentUseCase', () => {
    //creamos mocks de las dependencias
    const mockPaymentRepo = {
        create: vi.fn(),
        existsActiveForPeriod: vi.fn(),
    } as unknown as PaymentRepository;

    const mockMemberRepo = {
        findById: vi.fn(),
    } as unknown as MemberRepository;

    const mockValidator = {
        validateAmount: vi.fn(),
        validatePeriod: vi.fn(),
        validateDueDate: vi.fn(),
    } as unknown as PaymentValidator;

    const useCase = new CreatePaymentUseCase(mockPaymentRepo, mockMemberRepo, mockValidator);

    const mockRequest: CreatePaymentRequest = {
        member_id: 'uuid-member-1',
        amount: 1500,
        month: 5,
        year: 2026,
        due_date: '2026-05-31',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe crear el pago con status Pending y payment_date null', async () => {
        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce({ id: 'uuid-member-1' } as any);
        vi.mocked(mockPaymentRepo.existsActiveForPeriod).mockResolvedValueOnce(false);
        vi.mocked(mockPaymentRepo.create).mockResolvedValueOnce({
            id: 'uuid-pay-1',
            ...mockRequest,
            status: 'Pending',
            payment_date: null,
        });

        const result = await useCase.execute(mockRequest);

        expect(mockValidator.validateAmount).toHaveBeenCalledWith(mockRequest.amount);
        expect(mockValidator.validatePeriod).toHaveBeenCalledWith(mockRequest.month, mockRequest.year);
        expect(mockValidator.validateDueDate).toHaveBeenCalledWith(mockRequest.due_date);
        expect(result.status).toBe('Pending');
        expect(result.payment_date).toBeNull();
        expect(mockPaymentRepo.create).toHaveBeenCalledWith(expect.objectContaining({
            member_id: mockRequest.member_id,
            amount: mockRequest.amount,
            month: mockRequest.month,
            year: mockRequest.year,
        }));
    });

    it('debe lanzar error si el socio no existe', async () => {
        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce(null);

        await expect(useCase.execute(mockRequest)).rejects.toThrow('El socio especificado no existe');
        expect(mockPaymentRepo.create).not.toHaveBeenCalled();
    });

    it('debe lanzar error si ya existe un pago activo para el mismo período', async () => {
        vi.mocked(mockMemberRepo.findById).mockResolvedValueOnce({ id: 'uuid-member-1' } as any);
        vi.mocked(mockPaymentRepo.existsActiveForPeriod).mockResolvedValueOnce(true);

        await expect(useCase.execute(mockRequest)).rejects.toThrow(/Ya existe un pago activo/);
        expect(mockPaymentRepo.create).not.toHaveBeenCalled();
    });

    it('debe lanzar error y detenerse si la validación del monto falla', async () => {
        vi.mocked(mockValidator.validateAmount).mockImplementationOnce(() => {
            throw new Error('El monto debe ser mayor a cero');
        });

        await expect(useCase.execute(mockRequest)).rejects.toThrow('El monto debe ser mayor a cero');

        expect(mockMemberRepo.findById).not.toHaveBeenCalled();
        expect(mockPaymentRepo.create).not.toHaveBeenCalled();
    });

});