import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetMedicalCertificateByIdUseCase } from './GetMedicalCertificateByIdUseCase.js';
import { MedicalCertificateRepository } from '../../domain/MedicalCertificateRepository.js';
import { MedicalCertificateResponse } from '@alentapp/shared';

describe('GetMedicalCertificateByIdUseCase', () => {
    const mockMedicalCertificateRepo = {
        findById: vi.fn(),
    } as unknown as MedicalCertificateRepository;

    const useCase = new GetMedicalCertificateByIdUseCase(mockMedicalCertificateRepo);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe retornar el certificado si existe', async () => {
        const mockCertificate: MedicalCertificateResponse = {
            id: 'uuid-cert-1',
            member_id: 'uuid-member-1',
            doctor_license: '12345',
            issue_date: '2026-05-01',
            expiry_date: '2027-05-01',
            is_validated: true,
        };
        vi.mocked(mockMedicalCertificateRepo.findById).mockResolvedValueOnce(mockCertificate);

        const result = await useCase.execute('uuid-cert-1');

        expect(result.id).toBe('uuid-cert-1');
        expect(mockMedicalCertificateRepo.findById).toHaveBeenCalledWith('uuid-cert-1');
    });

    it('debe lanzar error si el certificado no existe', async () => {
        vi.mocked(mockMedicalCertificateRepo.findById).mockResolvedValueOnce(null);

        await expect(useCase.execute('uuid-cert-999'))
            .rejects.toThrow('El certificado no existe');
    });
});
