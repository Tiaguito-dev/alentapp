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

    describe('update', () => {
        it('debe retornar 200 y el pago actualizado', async () => {
            const mockPago = { id: 'uuid-pay-1', amount: 2000, status: 'Pending' };
            mockUpdateUseCase.execute.mockResolvedValueOnce(mockPago);

            await controller.update(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(200);
            expect(mockReply.send).toHaveBeenCalledWith({ data: mockPago });
        });

        it('debe retornar 409 si el pago no está en estado Pending', async () => {
            mockUpdateUseCase.execute.mockRejectedValueOnce(new Error('No se puede modificar un pago en estado Paid'));

            await controller.update(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(409);
        });
    });

    describe('markAsPaid', () => {
        it('debe retornar 200 y el pago marcado como pagado', async () => {
            const mockPago = { id: 'uuid-pay-1', status: 'Paid', payment_date: '2026-05-15T10:00:00.000Z' };
            mockMarkAsPaidUseCase.execute.mockResolvedValueOnce(mockPago);

            await controller.markAsPaid(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(200);
            expect(mockReply.send).toHaveBeenCalledWith({ data: mockPago });
        });

        it('debe retornar 409 si el pago ya fue cobrado', async () => {
            mockMarkAsPaidUseCase.execute.mockRejectedValueOnce(new Error('El pago ya fue marcado como pagado'));

            await controller.markAsPaid(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(409);
        });
    });

    describe('cancel', () => {
        it('debe retornar 200 y el pago cancelado', async () => {
            const mockPago = { id: 'uuid-pay-1', status: 'Canceled' };
            mockCancelUseCase.execute.mockResolvedValueOnce(mockPago);

            await controller.cancel(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(200);
            expect(mockReply.send).toHaveBeenCalledWith({ data: mockPago });
        });

        it('debe retornar 409 si intenta cancelar un pago ya cobrado', async () => {
            mockCancelUseCase.execute.mockRejectedValueOnce(new Error('No se puede cancelar un pago ya cobrado'));

            await controller.cancel(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(409);
        });
    });

    describe('delete', () => {
        it('debe retornar 204 si la baja es exitosa', async () => {
            mockDeleteUseCase.execute.mockResolvedValueOnce(undefined);

            await controller.delete(mockRequest as any, mockReply as any);

            expect(mockDeleteUseCase.execute).toHaveBeenCalledWith('uuid-pay-1');
            expect(mockReply.status).toHaveBeenCalledWith(204);
            expect(mockReply.send).toHaveBeenCalledWith();
        });

        it('debe retornar 404 si el pago no existe', async () => {
            mockDeleteUseCase.execute.mockRejectedValueOnce(new Error('El pago no existe'));

            await controller.delete(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(404);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'El pago no existe' });
        });

        it('debe retornar 409 si el pago ya fue cobrado', async () => {
            mockDeleteUseCase.execute.mockRejectedValueOnce(new Error('No se puede dar de baja un pago ya cobrado'));

            await controller.delete(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(409);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'No se puede dar de baja un pago ya cobrado' });
        });
    });

    describe('getAll', () => {
        it('debe retornar 200 y la lista de pagos', async () => {
            const mockPagos = [{ id: '1', status: 'Pending' }, { id: '2', status: 'Paid' }];
            mockListUseCase.execute.mockResolvedValueOnce(mockPagos);

            await controller.getAll(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(200);
            expect(mockReply.send).toHaveBeenCalledWith({ data: mockPagos });
        });

        it('debe retornar 500 si falla el caso de uso', async () => {
            mockListUseCase.execute.mockRejectedValueOnce(new Error('DB falló'));

            await controller.getAll(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(500);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Error interno, reintente más tarde' });
        });
    });

    describe('getById', () => {
        it('debe retornar 200 y el pago solicitado', async () => {
            const mockPago = { id: 'uuid-pay-1', status: 'Pending' };
            mockGetByIdUseCase.execute.mockResolvedValueOnce(mockPago);

            await controller.getById(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(200);
            expect(mockReply.send).toHaveBeenCalledWith({ data: mockPago });
        });

        it('debe retornar 404 si el pago no existe', async () => {
            mockGetByIdUseCase.execute.mockRejectedValueOnce(new Error('El pago no existe'));

            await controller.getById(mockRequest as any, mockReply as any);

            expect(mockReply.status).toHaveBeenCalledWith(404);
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'El pago no existe' });
        });
    });
});