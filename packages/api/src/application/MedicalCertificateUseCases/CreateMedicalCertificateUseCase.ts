import { CreateMedicalCertificateRequest, MedicalCertificateResponse } from '@alentapp/shared';
import { MedicalCertificateRepository } from '../../domain/MedicalCertificateRepository.js';
import { MemberRepository } from '../../domain/MemberRepository.js';
import { MedicalCertificateValidator } from '../../domain/services/MedicalCertificateValidator.js';

export class CreateMedicalCertificateUseCase {
  constructor(
    private readonly medicalCertificateRepository: MedicalCertificateRepository,
    private readonly memberRepository: MemberRepository,
    private readonly medicalCertificateValidator: MedicalCertificateValidator = new MedicalCertificateValidator(),
  ) {}

  async execute(data: CreateMedicalCertificateRequest): Promise<MedicalCertificateResponse> {
    this.medicalCertificateValidator.validateDoctorLicense(data.doctor_license);
    this.medicalCertificateValidator.validateIssueDate(data.issue_date);
    this.medicalCertificateValidator.validateExpiryDate(data.issue_date, data.expiry_date);

    // Validar que el socio exista
    const member = await this.memberRepository.findById(data.member_id);
    if (!member) {
      throw new Error('El socio especificado no existe');
    }

    return this.medicalCertificateRepository.createWithInvalidation(data);
  }
}
