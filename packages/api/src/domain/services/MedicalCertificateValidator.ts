type CodedError = Error & { code: string };

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const createMedicalCertificateValidationError = (
  code: string,
  message: string,
): CodedError => {
  const err = new Error(message) as CodedError;
  err.code = code;
  return err;
};

export class MedicalCertificateValidator {
  validateDoctorLicense(doctorLicense: string): void {
    if (!doctorLicense.trim()) {
      throw createMedicalCertificateValidationError(
        'INVALID_DOCTOR_LICENSE',
        'La matrícula del médico es obligatoria',
      );
    }
  }

  validateDateFormat(value: string): void {
    if (!ISO_DATE_PATTERN.test(value)) {
      throw createMedicalCertificateValidationError(
        'INVALID_DATE_FORMAT',
        'Formato de fecha inválido (esperado YYYY-MM-DD)',
      );
    }

    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
      throw createMedicalCertificateValidationError(
        'INVALID_DATE_FORMAT',
        'Formato de fecha inválido (esperado YYYY-MM-DD)',
      );
    }
  }

  validateIssueDate(issueDate: string): void {
    this.validateDateFormat(issueDate);

    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const parsedIssueDate = new Date(`${issueDate}T00:00:00.000Z`);

    if (parsedIssueDate > today) {
      throw createMedicalCertificateValidationError(
        'INVALID_ISSUE_DATE',
        'La fecha de emisión no puede ser futura',
      );
    }
  }

  validateExpiryDate(issueDate: string, expiryDate: string): void {
    this.validateDateFormat(expiryDate);

    if (expiryDate <= issueDate) {
      throw createMedicalCertificateValidationError(
        'INVALID_DATE_ORDER',
        'La fecha de vencimiento debe ser posterior a la de emisión',
      );
    }
  }
}