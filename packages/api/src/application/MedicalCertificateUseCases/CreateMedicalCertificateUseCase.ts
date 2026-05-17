import { CreateMedicalCertificateRequest, MedicalCertificateResponse } from '@alentapp/shared';
import { MedicalCertificateRepository } from '../../domain/MedicalCertificateRepository.js';

export class CreateMedicalCertificateUseCase {
  constructor(
    private readonly medicalCertificateRepository: MedicalCertificateRepository,
  ) {}

  async execute(data: CreateMedicalCertificateRequest): Promise<MedicalCertificateResponse> {
    return this.medicalCertificateRepository.create(data);
  }
}
