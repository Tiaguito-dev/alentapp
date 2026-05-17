import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InvalidateMedicalCertificateUseCase } from './InvalidateMedicalCertificateUseCase.js';
import { MedicalCertificateRepository } from '../../domain/MedicalCertificateRepository.js';

describe('InvalidateMedicalCertificateUseCase', () => {
  const mockRepository = {
    findById: vi.fn(),
    update: vi.fn(),
  } as unknown as MedicalCertificateRepository;

  const useCase = new InvalidateMedicalCertificateUseCase(mockRepository);

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
  });

  it('rechaza si el certificado no existe', async () => {
    vi.mocked(mockRepository.findById).mockResolvedValueOnce(null);

    await expect(useCase.execute('missing')).rejects.toThrow('El certificado no existe');
  });

  it('rechaza si ya está invalidado', async () => {
    vi.mocked(mockRepository.findById).mockResolvedValueOnce({
      ...existingCertificate,
      is_validated: false,
    });

    await expect(useCase.execute('cert-1'))
      .rejects
      .toThrow('El certificado ya se encuentra invalidado');
  });

  it('marca el certificado como invalidado', async () => {
    vi.mocked(mockRepository.findById).mockResolvedValueOnce(existingCertificate);
    vi.mocked(mockRepository.update).mockResolvedValueOnce({
      ...existingCertificate,
      is_validated: false,
    });

    const result = await useCase.execute('cert-1');

    expect(mockRepository.update).toHaveBeenCalledWith('cert-1', { is_validated: false });
    expect(result.is_validated).toBe(false);
  });
});