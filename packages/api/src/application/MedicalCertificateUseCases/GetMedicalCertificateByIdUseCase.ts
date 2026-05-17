import { MedicalCertificateResponse } from '@alentapp/shared';
import { MedicalCertificateRepository } from '../../domain/MedicalCertificateRepository.js';

export class GetMedicalCertificateByIdUseCase {
  constructor(
    private readonly medicalCertificateRepository: MedicalCertificateRepository,
  ) {}

  async execute(id: string): Promise<MedicalCertificateResponse> {
    const certificate = await this.medicalCertificateRepository.findById(id);
    if (!certificate) {
      throw new Error('El certificado no existe');
    }

    return certificate;
  }
}
