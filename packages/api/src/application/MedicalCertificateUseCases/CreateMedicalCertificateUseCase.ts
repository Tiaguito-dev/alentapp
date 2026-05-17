import { CreateMedicalCertificateRequest, MedicalCertificateResponse } from '@alentapp/shared';
import { MedicalCertificateRepository } from '../../domain/MedicalCertificateRepository.js';

type CodedError = Error & { code: string };

const createValidationError = (code: string, message: string): CodedError => {
  const err = new Error(message) as CodedError;
  err.code = code;
  return err;
};

const isValidIsoDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.toISOString().slice(0, 10) === value;
};

export class CreateMedicalCertificateUseCase {
  constructor(
    private readonly medicalCertificateRepository: MedicalCertificateRepository,
  ) {}

  async execute(data: CreateMedicalCertificateRequest): Promise<MedicalCertificateResponse> {
    if (!data.doctor_license?.trim()) {
      throw createValidationError('INVALID_DOCTOR_LICENSE', 'La matrícula del médico es obligatoria');
    }

    if (!isValidIsoDate(data.issue_date)) {
      throw createValidationError('INVALID_ISSUE_DATE', 'La fecha de emisión es inválida');
    }

    if (!isValidIsoDate(data.expiry_date)) {
      throw createValidationError('INVALID_EXPIRY_DATE', 'La fecha de vencimiento es inválida');
    }

    if (data.expiry_date < data.issue_date) {
      throw createValidationError('INVALID_DATE_ORDER', 'La fecha de vencimiento no puede ser anterior a la fecha de emisión');
    }

    return this.medicalCertificateRepository.create(data);
  }
}
