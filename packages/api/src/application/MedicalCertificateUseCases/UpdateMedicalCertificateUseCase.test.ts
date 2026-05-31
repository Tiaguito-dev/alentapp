import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateMedicalCertificateUseCase } from './UpdateMedicalCertificateUseCase';
import { MedicalCertificateRepository } from '../../domain/MedicalCertificateRepository';
import { MedicalCertificateValidator } from '../../domain/services/MedicalCertificateValidator';
import { MedicalCertificateDTO } from '@alentapp/shared';

describe('UpdateMedicalCertificateUseCase', () => {
  let mockRepo: { findById: ReturnType<typeof vi.fn>, update: ReturnType<typeof vi.fn> };
  let mockValidator: MedicalCertificateValidator;
  let useCase: UpdateMedicalCertificateUseCase;
  const mockCertificate: any = {
    id: 'cert-1',
    member_id: 'member-1',
    issue_date: '2026-05-01',
    expiry_date: '2026-11-01',
    doctor_license: 'DOC123',
    is_validated: true,
  };

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      update: vi.fn(),
    };
    mockValidator = new MedicalCertificateValidator();
    useCase = new UpdateMedicalCertificateUseCase(mockRepo as any, mockValidator);
    vi.clearAllMocks();
  });

  it('debe actualizar correctamente si los datos son válidos', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValueOnce(mockCertificate);
    vi.mocked(mockRepo.update).mockResolvedValueOnce({ ...mockCertificate, doctor_license: '12345' });

    const result = await useCase.execute('cert-1', { doctor_license: '12345' });

    expect(mockRepo.update).toHaveBeenCalledWith('cert-1', expect.objectContaining({ doctor_license: '12345' }));
    expect(result.doctor_license).toBe('12345');
  });

  it('debe lanzar error si el certificado no existe', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValueOnce(null);
    await expect(useCase.execute('cert-2', { doctor_license: 'DOC999' }))
      .rejects.toThrow('El certificado no existe');
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('debe lanzar error si el certificado está invalidado', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValueOnce({ ...mockCertificate, is_validated: false });
    await expect(useCase.execute('cert-1', { doctor_license: 'DOC999' }))
      .rejects.toThrow('No se puede modificar un certificado invalidado');
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('debe lanzar error si no se envía ningún campo a modificar', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValueOnce(mockCertificate);
    await expect(useCase.execute('cert-1', {}))
      .rejects.toThrow('Debe proveer al menos un campo a modificar');
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('debe lanzar error si el validador falla', async () => {
    vi.mocked(mockRepo.findById).mockResolvedValueOnce(mockCertificate);
    // Forzar error en el validador real
    vi.spyOn(mockValidator, 'validateDoctorLicense').mockImplementationOnce(() => { throw new Error('error de validación'); });
    await expect(useCase.execute('cert-1', { doctor_license: 'INVALID' }))
      .rejects.toThrow('error de validación');
    expect(mockRepo.update).not.toHaveBeenCalled();
  });
});
