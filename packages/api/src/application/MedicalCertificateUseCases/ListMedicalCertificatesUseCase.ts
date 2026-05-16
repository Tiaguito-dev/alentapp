import { MedicalCertificateResponse } from '@alentapp/shared';
import { MedicalCertificateRepository } from '../../domain/MedicalCertificateRepository.js';

export class ListMedicalCertificatesUseCase {
  constructor(
    private readonly medicalCertificateRepository: MedicalCertificateRepository,
  ) {}

  async execute(): Promise<MedicalCertificateResponse[]> {
    return this.medicalCertificateRepository.findAll();
  }
}
