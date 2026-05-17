import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateMedicalCertificateUseCase } from './UpdateMedicalCertificateUseCase.js';
import { MedicalCertificateRepository } from '../../domain/MedicalCertificateRepository.js';
import { MedicalCertificateValidator } from '../../domain/services/MedicalCertificateValidator.js';

describe('UpdateMedicalCertificateUseCase', () => {
  const mockRepository = {
    findById: vi.fn(),
    update: vi.fn(),
  } as unknown as MedicalCertificateRepository;

  const validator = new MedicalCertificateValidator();
  const useCase = new UpdateMedicalCertificateUseCase(mockRepository, validator);

  const existingCertificate = {
    id: 'cert-1',
    member_id: 'member-1',
    issue_date: '2026-01-10',
    expiry_date: '2026-12-10',
    doctor_license: 'MP-123',
    is_validated: true,
    created_at: '2026-01-10T10:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockRepository.findById).mockResolvedValue(existingCertificate);
  });

  it('rechaza si el certificado no existe', async () => {
    vi.mocked(mockRepository.findById).mockResolvedValueOnce(null);

    await expect(useCase.execute('missing', { doctor_license: 'MP-999' }))
      .rejects
      .toThrow('El certificado no existe');
  });

  it('rechaza si el certificado ya está invalidado', async () => {
    vi.mocked(mockRepository.findById).mockResolvedValueOnce({
      ...existingCertificate,
      is_validated: false,
    });

    await expect(useCase.execute('cert-1', { doctor_license: 'MP-999' }))
      .rejects
      .toThrow('No se puede modificar un certificado invalidado');
  });

  it('rechaza body vacío tras ignorar campos no permitidos', async () => {
    await expect(useCase.execute('cert-1', {})).rejects.toThrow(
      'Debe proveer al menos un campo a modificar',
    );
  });

  it('actualiza solo campos permitidos', async () => {
    vi.mocked(mockRepository.update).mockResolvedValueOnce({
      ...existingCertificate,
      doctor_license: 'MP-999',
    });

    await useCase.execute('cert-1', {
      doctor_license: 'MP-999',
      // @ts-expect-error validamos ignorar campos ajenos al contrato en runtime
      member_id: 'otro-socio',
      // @ts-expect-error validamos ignorar campos ajenos al contrato en runtime
      is_validated: false,
    });

    expect(mockRepository.update).toHaveBeenCalledWith('cert-1', {
      doctor_license: 'MP-999',
    });
  });

  it('valida la fecha resultante al actualizar solo expiry_date', async () => {
    await expect(useCase.execute('cert-1', { expiry_date: '2025-01-01' }))
      .rejects
      .toThrow('La fecha de vencimiento debe ser posterior a la de emisión');
  });
});