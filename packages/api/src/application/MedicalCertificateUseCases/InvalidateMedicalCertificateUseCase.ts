import { MedicalCertificateResponse } from '@alentapp/shared';
import { MedicalCertificateRepository } from '../../domain/MedicalCertificateRepository.js';

export class InvalidateMedicalCertificateUseCase {
  constructor(
    private readonly medicalCertificateRepository: MedicalCertificateRepository,
  ) {}

  async execute(id: string): Promise<MedicalCertificateResponse> {
    const certificate = await this.medicalCertificateRepository.findById(id);
    if (!certificate) {
      throw new Error('El certificado no existe');
    }

    if (!certificate.is_validated) {
      throw new Error('El certificado ya se encuentra invalidado');
    }

    return this.medicalCertificateRepository.update(id, { is_validated: false });
  }
}