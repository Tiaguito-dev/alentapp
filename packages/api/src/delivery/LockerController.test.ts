import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LockerController } from './LockerController.js';
import { FastifyRequest, FastifyReply } from 'fastify';

describe('LockerController - Tests Unitarios (Update)', () => {
  // 1. Mockeamos SOLAMENTE el UseCase de Update
  const mockUpdateUseCase = { execute: vi.fn() };

  // Inyectamos el mock y pasamos 'any' a los demás para no romper la firma del constructor
  const controller = new LockerController(
    {} as any, // create
    mockUpdateUseCase as any, // UPDATE (el que nos importa)
    {} as any, // delete
    {} as any, // list
    {} as any  // getByNumber
  );

  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn()
    };
  });

  describe('PATCH /api/v1/lockers/:number', () => {
    it('debe retornar 200 y el casillero actualizado en caso de éxito', async () => {
      const mockRequest = { params: { number: '10' }, body: { member_id: 'socio-1' } } as unknown as FastifyRequest<any>;
      const fakeUpdatedLocker = { number: 10, status: 'Occupied', member_id: 'socio-1' };
      
      mockUpdateUseCase.execute.mockResolvedValue(fakeUpdatedLocker);

      await controller.update(mockRequest, mockReply as FastifyReply);

      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith(fakeUpdatedLocker);
    });

    it('debe retornar 422 si el casillero está en mantenimiento', async () => {
      const mockRequest = { params: { number: '10' }, body: { member_id: 'socio-1' } } as unknown as FastifyRequest<any>;
      
      mockUpdateUseCase.execute.mockRejectedValue(new Error('error: casillero en mantenimiento'));

      await controller.update(mockRequest, mockReply as FastifyReply);

      expect(mockReply.status).toHaveBeenCalledWith(422);
      expect(mockReply.send).toHaveBeenCalledWith({ error: 'error: casillero en mantenimiento' });
    });

    it('debe retornar 404 si el casillero no existe', async () => {
      const mockRequest = { params: { number: '999' }, body: { status: 'Maintenance' } } as unknown as FastifyRequest<any>;
      
      mockUpdateUseCase.execute.mockRejectedValue(new Error('El casillero especificado no fue encontrado'));

      await controller.update(mockRequest, mockReply as FastifyReply);

      expect(mockReply.status).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({ error: 'El casillero especificado no fue encontrado' });
    });

    it('debe retornar 400 si el socio ya tiene un casillero', async () => {
      const mockRequest = { params: { number: '10' }, body: { member_id: 'socio-123' } } as unknown as FastifyRequest<any>;
      
      mockUpdateUseCase.execute.mockRejectedValue(new Error('ya tiene un casillero asignado'));

      await controller.update(mockRequest, mockReply as FastifyReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({ error: 'ya tiene un casillero asignado' });
    });

    it('debe retornar 409 si se necesita desasignar al socio primero', async () => {
      const mockRequest = { params: { number: '10' }, body: { status: 'Maintenance' } } as unknown as FastifyRequest<any>;
      
      mockUpdateUseCase.execute.mockRejectedValue(new Error('desasigne al socio primero'));

      await controller.update(mockRequest, mockReply as FastifyReply);

      expect(mockReply.status).toHaveBeenCalledWith(409);
      expect(mockReply.send).toHaveBeenCalledWith({ error: 'desasigne al socio primero' });
    });
  });
});