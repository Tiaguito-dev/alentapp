import { MedicalCertificateRepository } from '../../domain/MedicalCertificateRepository.js';

export class DeleteMedicalCertificateUseCase {
  constructor(
    private readonly medicalCertificateRepository: MedicalCertificateRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const certificate = await this.medicalCertificateRepository.findById(id);
    if (!certificate) {
      throw new Error('El certificado no existe');
    }

    await this.medicalCertificateRepository.update(id, { deleted_at: new Date() });
  }
}
