import { CreateMedicalCertificateRequest, MedicalCertificateResponse } from '@alentapp/shared';
import { MedicalCertificateRepository } from '../../domain/MedicalCertificateRepository.js';
import { MedicalCertificateValidator } from '../../domain/services/MedicalCertificateValidator.js';

export class CreateMedicalCertificateUseCase {
  constructor(
    private readonly medicalCertificateRepository: MedicalCertificateRepository,
    private readonly medicalCertificateValidator: MedicalCertificateValidator = new MedicalCertificateValidator(),
  ) {}

  async execute(data: CreateMedicalCertificateRequest): Promise<MedicalCertificateResponse> {
    this.medicalCertificateValidator.validateDoctorLicense(data.doctor_license);
    this.medicalCertificateValidator.validateIssueDate(data.issue_date);
    this.medicalCertificateValidator.validateExpiryDate(data.issue_date, data.expiry_date);

    return this.medicalCertificateRepository.create(data);
  }
}
