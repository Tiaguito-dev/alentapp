import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateMedicalCertificateUseCase } from './UpdateMedicalCertificateUseCase';
import { MedicalCertificateRepository } from '../../domain/MedicalCertificateRepository';
import { MedicalCertificateValidator } from '../../domain/services/MedicalCertificateValidator';
import { MedicalCertificateDTO } from '@alentapp/shared';

describe('UpdateMedicalCertificateUseCase', () => {
  let mockRepo: jest.Mocked<MedicalCertificateRepository>;
  let mockValidator: jest.Mocked<MedicalCertificateValidator>;
  let useCase: UpdateMedicalCertificateUseCase;
  const mockCertificate: MedicalCertificateDTO = {
    id: 'cert-1',
    member_id: 'member-1',
    registration: '12345',
    from: '2026-05-01',
    to: '2026-11-01',
    type: 'Aptitud',
    institution: 'Hospital',
    observations: '',
  };

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      update: vi.fn(),
    } as any;
    mockValidator = {
      validateUpdate: vi.fn(),
    } as any;
    useCase = new UpdateMedicalCertificateUseCase(mockRepo, mockValidator);
    vi.clearAllMocks();
  });

  it('debe actualizar correctamente si los datos son válidos', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValueOnce(mockCertificate);
    vi.mocked(mockValidator.validateUpdate).mockReturnValueOnce(undefined);
    vi.mocked(mockRepo.update).mockResolvedValueOnce({ ...mockCertificate, registration: '54321' });

    const result = await useCase.execute('cert-1', { registration: '54321' });

    expect(mockValidator.validateUpdate).toHaveBeenCalledWith(mockCertificate, { registration: '54321' });
    expect(mockRepo.update).toHaveBeenCalledWith('cert-1', expect.objectContaining({ registration: '54321' }));
    expect(result.registration).toBe('54321');
  });

  it('debe lanzar error si el certificado no existe', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValueOnce(null);
    await expect(useCase.execute('cert-2', { registration: '54321' }))
      .rejects.toThrow('El certificado especificado no fue encontrado');
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('debe lanzar error si el validador falla', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValueOnce(mockCertificate);
    vi.mocked(mockValidator.validateUpdate).mockImplementationOnce(() => {
      throw new Error('error de validación');
    });
    await expect(useCase.execute('cert-1', { registration: '54321' }))
      .rejects.toThrow('error de validación');
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('debe lanzar error si no se envía ningún campo a modificar', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValueOnce(mockCertificate);
    await expect(useCase.execute('cert-1', {}))
      .rejects.toThrow('Debe proveer al menos un campo a modificar');
    expect(mockRepo.update).not.toHaveBeenCalled();
  });
});
