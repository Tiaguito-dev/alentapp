import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListMedicalCertificatesUseCase } from './ListMedicalCertificatesUseCase.js';
import { MedicalCertificateRepository } from '../../domain/MedicalCertificateRepository.js';
import { MedicalCertificateResponse } from '@alentapp/shared';

describe('ListMedicalCertificatesUseCase', () => {
    const mockMedicalCertificateRepo = {
        findAll: vi.fn(),
    } as unknown as MedicalCertificateRepository;

    const useCase = new ListMedicalCertificatesUseCase(mockMedicalCertificateRepo);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe retornar la lista de certificados', async () => {
        const mockCertificates: MedicalCertificateResponse[] = [
            { id: '1', member_id: 'member-1', doctor_license: '12345', issue_date: '2026-05-01', expiry_date: '2027-05-01', is_validated: true },
        ];
        vi.mocked(mockMedicalCertificateRepo.findAll).mockResolvedValueOnce(mockCertificates);

        const result = await useCase.execute();

        expect(result).toHaveLength(1);
        expect(mockMedicalCertificateRepo.findAll).toHaveBeenCalledOnce();
    });
});
