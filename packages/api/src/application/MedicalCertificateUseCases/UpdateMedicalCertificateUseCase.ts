import {
  MedicalCertificateResponse,
  UpdateMedicalCertificateRequest,
} from '@alentapp/shared';
import { MedicalCertificateRepository } from '../../domain/MedicalCertificateRepository.js';
import { MedicalCertificateValidator } from '../../domain/services/MedicalCertificateValidator.js';

const hasNoFieldsToUpdate = (data: UpdateMedicalCertificateRequest): boolean => (
  data.issue_date === undefined
  && data.expiry_date === undefined
  && data.doctor_license === undefined
);

export class UpdateMedicalCertificateUseCase {
  constructor(
    private readonly medicalCertificateRepository: MedicalCertificateRepository,
    private readonly medicalCertificateValidator: MedicalCertificateValidator = new MedicalCertificateValidator(),
  ) {}

  async execute(
    id: string,
    data: UpdateMedicalCertificateRequest,
  ): Promise<MedicalCertificateResponse> {
    const certificate = await this.medicalCertificateRepository.findById(id);
    if (!certificate) {
      throw new Error('El certificado no existe');
    }

    if (!certificate.is_validated) {
      throw new Error('No se puede modificar un certificado invalidado');
    }

    const allowedData: UpdateMedicalCertificateRequest = {
      ...(data.issue_date !== undefined && { issue_date: data.issue_date }),
      ...(data.expiry_date !== undefined && { expiry_date: data.expiry_date }),
      ...(data.doctor_license !== undefined && { doctor_license: data.doctor_license }),
    };

    if (hasNoFieldsToUpdate(allowedData)) {
      throw new Error('Debe proveer al menos un campo a modificar');
    }

    const finalIssueDate = allowedData.issue_date ?? certificate.issue_date;
    const finalExpiryDate = allowedData.expiry_date ?? certificate.expiry_date;

    if (allowedData.issue_date !== undefined) {
      this.medicalCertificateValidator.validateIssueDate(allowedData.issue_date);
    }
    if (allowedData.expiry_date !== undefined) {
      this.medicalCertificateValidator.validateDateFormat(allowedData.expiry_date);
    }
    if (allowedData.issue_date !== undefined || allowedData.expiry_date !== undefined) {
      this.medicalCertificateValidator.validateExpiryDate(finalIssueDate, finalExpiryDate);
    }
    if (allowedData.doctor_license !== undefined) {
      this.medicalCertificateValidator.validateDoctorLicense(allowedData.doctor_license);
    }

    return this.medicalCertificateRepository.update(id, allowedData);
  }
}