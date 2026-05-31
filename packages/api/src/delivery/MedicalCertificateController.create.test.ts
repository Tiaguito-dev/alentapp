import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MedicalCertificateController } from './MedicalCertificateController';

const mockReply = () => {
  const reply: any = {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  return reply;
};

describe('MedicalCertificateController - create', () => {
  let controller: MedicalCertificateController;
  let mockCreateUseCase: { execute: any };

  beforeEach(() => {
    mockCreateUseCase = { execute: vi.fn() };
    controller = new MedicalCertificateController(
      mockCreateUseCase as any,
      {} as any, // list
      {} as any, // getById
      {} as any, // update
      {} as any, // invalidate
      {} as any  // delete
    );
  });

  it('debe crear un certificado y responder 201', async () => {
    const fakeCert = {
      id: 'cert-1',
      member_id: 'member-1',
      issue_date: '2026-05-01',
      expiry_date: '2027-05-01',
      doctor_license: '12345',
    };
    mockCreateUseCase.execute.mockResolvedValueOnce(fakeCert);
    const req = {
      body: {
        member_id: 'member-1',
        issue_date: '2026-05-01',
        expiry_date: '2027-05-01',
        doctor_license: '12345',
      },
    } as any;
    const reply = mockReply();

    await controller.create(req, reply);

    expect(mockCreateUseCase.execute).toHaveBeenCalledWith(req.body);
    expect(reply.status).toHaveBeenCalledWith(201);
    expect(reply.send).toHaveBeenCalledWith({ data: fakeCert });
  });

  it('debe responder 404 si el socio no existe', async () => {
    const error = { code: 'P2003', message: 'El socio especificado no existe' };
    mockCreateUseCase.execute.mockRejectedValueOnce(error);
    const req = {
      body: {
        member_id: 'member-1',
        issue_date: '2026-05-01',
        expiry_date: '2027-05-01',
        doctor_license: '12345',
      },
    } as any;
    const reply = mockReply();

    await controller.create(req, reply);

    expect(mockCreateUseCase.execute).toHaveBeenCalledWith(req.body);
    expect(reply.status).toHaveBeenCalledWith(404);
    expect(reply.send).toHaveBeenCalledWith({ error: 'El socio especificado no existe' });
  });

  it('debe responder 400 si hay error de validación', async () => {
    const error = { code: 'INVALID_DOCTOR_LICENSE', message: 'Matrícula inválida' };
    mockCreateUseCase.execute.mockRejectedValueOnce(error);
    const req = {
      body: {
        member_id: 'member-1',
        issue_date: '2026-05-01',
        expiry_date: '2027-05-01',
        doctor_license: 'bad',
      },
    } as any;
    const reply = mockReply();

    await controller.create(req, reply);

    expect(mockCreateUseCase.execute).toHaveBeenCalledWith(req.body);
    expect(reply.status).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalledWith({ error: 'Matrícula inválida' });
  });

  it('debe responder 500 ante error inesperado', async () => {
    mockCreateUseCase.execute.mockRejectedValueOnce(new Error('Error inesperado'));
    const req = {
      body: {
        member_id: 'member-1',
        issue_date: '2026-05-01',
        expiry_date: '2027-05-01',
        doctor_license: '12345',
      },
    } as any;
    const reply = mockReply();

    await controller.create(req, reply);

    expect(mockCreateUseCase.execute).toHaveBeenCalledWith(req.body);
    expect(reply.status).toHaveBeenCalledWith(500);
    expect(reply.send).toHaveBeenCalledWith({ error: 'Error interno, reintente más tarde' });
  });
});
