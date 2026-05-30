import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MedicalCertificateController } from './MedicalCertificateController';

const mockReply = () => {
  const reply: any = {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  return reply;
};

describe('MedicalCertificateController - update', () => {
  let controller: MedicalCertificateController;
  let mockUpdateUseCase: { execute: any };

  beforeEach(() => {
    mockUpdateUseCase = { execute: vi.fn() };
    controller = new MedicalCertificateController(
      {} as any, // create
      {} as any, // list
      {} as any, // getById
      mockUpdateUseCase as any,
      {} as any, // invalidate
      {} as any  // delete
    );
  });

  it('debe actualizar un certificado y responder 200', async () => {
    const fakeCert = { id: 'cert-1', registration: '54321' };
    mockUpdateUseCase.execute.mockResolvedValueOnce(fakeCert);
    const req = { params: { id: 'cert-1' }, body: { registration: '54321' } } as any;
    const reply = mockReply();

    await controller.update(req, reply);

    expect(mockUpdateUseCase.execute).toHaveBeenCalledWith('cert-1', { registration: '54321' });
    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith({ data: fakeCert });
  });

  it('debe responder 404 si el certificado no existe', async () => {
    mockUpdateUseCase.execute.mockRejectedValueOnce(new Error('El certificado no existe'));
    const req = { params: { id: 'cert-404' }, body: { registration: '54321' } } as any;
    const reply = mockReply();

    await controller.update(req, reply);

    expect(reply.status).toHaveBeenCalledWith(404);
    expect(reply.send).toHaveBeenCalledWith({ error: 'El certificado no existe' });
  });

  it('debe responder 409 si el certificado está invalidado', async () => {
    mockUpdateUseCase.execute.mockRejectedValueOnce(new Error('No se puede modificar un certificado invalidado'));
    const req = { params: { id: 'cert-1' }, body: { registration: '54321' } } as any;
    const reply = mockReply();

    await controller.update(req, reply);

    expect(reply.status).toHaveBeenCalledWith(409);
    expect(reply.send).toHaveBeenCalledWith({ error: 'No se puede modificar un certificado invalidado' });
  });

  it('debe responder 400 si falta campo a modificar', async () => {
    mockUpdateUseCase.execute.mockRejectedValueOnce(new Error('Debe proveer al menos un campo a modificar'));
    const req = { params: { id: 'cert-1' }, body: {} } as any;
    const reply = mockReply();

    await controller.update(req, reply);

    expect(reply.status).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalledWith({ error: 'Debe proveer al menos un campo a modificar' });
  });

  it('debe responder 400 si hay error de validación', async () => {
    const error = { message: 'Matrícula inválida', code: 'INVALID_DOCTOR_LICENSE' };
    mockUpdateUseCase.execute.mockRejectedValueOnce(error);
    const req = { params: { id: 'cert-1' }, body: { registration: 'bad' } } as any;
    const reply = mockReply();

    await controller.update(req, reply);

    expect(reply.status).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalledWith({ error: 'Matrícula inválida' });
  });

  it('debe responder 500 ante error inesperado', async () => {
    mockUpdateUseCase.execute.mockRejectedValueOnce(new Error('Error inesperado'));
    const req = { params: { id: 'cert-1' }, body: { registration: '54321' } } as any;
    const reply = mockReply();

    await controller.update(req, reply);

    expect(reply.status).toHaveBeenCalledWith(500);
    expect(reply.send).toHaveBeenCalledWith({ error: 'Error interno, reintente más tarde' });
  });
});
