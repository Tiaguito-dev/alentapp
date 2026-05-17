import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MedicalCertificateController } from './MedicalCertificateController.js';

describe('MedicalCertificateController', () => {
  const mockCreateUseCase = { execute: vi.fn() };
  const mockListUseCase = { execute: vi.fn() };
  const mockUpdateUseCase = { execute: vi.fn() };
  const mockInvalidateUseCase = { execute: vi.fn() };

  const controller = new MedicalCertificateController(
    mockCreateUseCase as any,
    mockListUseCase as any,
    mockUpdateUseCase as any,
    mockInvalidateUseCase as any,
  );

  const mockReply = {
    status: vi.fn().mockReturnThis(),
    send: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devuelve 200 al actualizar exitosamente', async () => {
    const certificate = { id: 'cert-1' };
    mockUpdateUseCase.execute.mockResolvedValueOnce(certificate);

    await controller.update({ params: { id: 'cert-1' }, body: { doctor_license: 'MP-999' } } as any, mockReply as any);

    expect(mockUpdateUseCase.execute).toHaveBeenCalledWith('cert-1', { doctor_license: 'MP-999' });
    expect(mockReply.status).toHaveBeenCalledWith(200);
    expect(mockReply.send).toHaveBeenCalledWith({ data: certificate });
  });

  it('devuelve 400 si la validación falla', async () => {
    const error = Object.assign(new Error('Formato de fecha inválido (esperado YYYY-MM-DD)'), {
      code: 'INVALID_DATE_FORMAT',
    });
    mockUpdateUseCase.execute.mockRejectedValueOnce(error);

    await controller.update({ params: { id: 'cert-1' }, body: { issue_date: '10/01/2026' } } as any, mockReply as any);

    expect(mockReply.status).toHaveBeenCalledWith(400);
  });

  it('devuelve 409 si el certificado ya está invalidado al editar', async () => {
    mockUpdateUseCase.execute.mockRejectedValueOnce(new Error('No se puede modificar un certificado invalidado'));

    await controller.update({ params: { id: 'cert-1' }, body: { doctor_license: 'MP-999' } } as any, mockReply as any);

    expect(mockReply.status).toHaveBeenCalledWith(409);
  });

  it('devuelve 200 al invalidar exitosamente', async () => {
    const certificate = { id: 'cert-1', is_validated: false };
    mockInvalidateUseCase.execute.mockResolvedValueOnce(certificate);

    await controller.invalidate({ params: { id: 'cert-1' } } as any, mockReply as any);

    expect(mockReply.status).toHaveBeenCalledWith(200);
    expect(mockReply.send).toHaveBeenCalledWith({ data: certificate });
  });

  it('devuelve 409 si el certificado ya estaba invalidado', async () => {
    mockInvalidateUseCase.execute.mockRejectedValueOnce(new Error('El certificado ya se encuentra invalidado'));

    await controller.invalidate({ params: { id: 'cert-1' } } as any, mockReply as any);

    expect(mockReply.status).toHaveBeenCalledWith(409);
  });
});