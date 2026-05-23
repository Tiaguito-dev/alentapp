import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentController } from './PaymentController.js';

describe('PaymentController', () => {
    //mock de los casos de uso
    const mockCreateUseCase = { execute: vi.fn() };
    const mockUpdateUseCase = { execute: vi.fn() };
    const mockMarkAsPaidUseCase = { execute: vi.fn() };
    const mockCancelUseCase = { execute: vi.fn() };
    const mockDeleteUseCase = { execute: vi.fn() };
    const mockListUseCase = { execute: vi.fn() };
    const mockGetByIdUseCase = { execute: vi.fn() };

    const controller = new PaymentController(
        mockCreateUseCase as any,
        mockUpdateUseCase as any,
        mockMarkAsPaidUseCase as any,
        mockCancelUseCase as any,
        mockDeleteUseCase as any,
        mockListUseCase as any,
        mockGetByIdUseCase as any,
    );

    const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
    };

    const mockRequest = {
        body: { member_id: 'uuid-member-1', amount: 1500, month: 5, year: 2026, due_date: '2026-05-31' },
        params: { id: 'uuid-pay-1' },
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('create', () => {
        it('debe retornar 201 y el pago creado', async () => {
            const mockPago = { id: 'uuid-pay-1', status: 'Pending' };
            mockCreateUseCase.execute.mockResolvedValueOnce(mockPago);

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(201);
            expect(mockReply.send).toHaveBeenCalledWith({ data: mockPago });
        });

        it('debe retornar 404 si el socio no existe', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(new Error('El socio especificado no existe'));

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(404);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'El socio especificado no existe' });
        });

        it('debe retornar 409 si ya existe un pago activo para el período', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(new Error('Ya existe un pago activo para este socio en 5/2026'));

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(409);
        });

        it('debe retornar 400 si el monto es inválido', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(new Error('El monto debe ser mayor a cero'));

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(400);
        });

        it('debe retornar 500 ante un error genérico', async () => {
            mockCreateUseCase.execute.mockRejectedValueOnce(new Error('DB connection failed'));

            await controller.create(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(500);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Error interno, reintente más tarde' });
        });
    });
});