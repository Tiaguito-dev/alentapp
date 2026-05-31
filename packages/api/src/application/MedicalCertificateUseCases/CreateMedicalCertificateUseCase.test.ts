import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateMedicalCertificateUseCase } from './CreateMedicalCertificateUseCase.js';
import { MedicalCertificateRepository } from '../../domain/MedicalCertificateRepository.js';
import { MemberRepository } from '../../domain/MemberRepository.js';
import { MedicalCertificateValidator } from '../../domain/services/MedicalCertificateValidator.js';
import { CreateMedicalCertificateRequest, MedicalCertificateResponse } from '@alentapp/shared';

describe('CreateMedicalCertificateUseCase', () => {
  const mockMedicalCertificateRepository = {
    createWithInvalidation: vi.fn(),
  } as unknown as MedicalCertificateRepository;

  const mockMemberRepository = {
    findById: vi.fn(),
  } as unknown as MemberRepository;

  const mockMedicalCertificateValidator = {
    validateDoctorLicense: vi.fn(),
    validateIssueDate: vi.fn(),
    validateExpiryDate: vi.fn(),
  } as unknown as MedicalCertificateValidator;

  const useCase = new CreateMedicalCertificateUseCase(
    mockMedicalCertificateRepository,
    mockMemberRepository,
    mockMedicalCertificateValidator
  );

  const request: CreateMedicalCertificateRequest = {
    member_id: 'member-1',
    issue_date: '2026-05-01',
    expiry_date: '2027-05-01',
    doctor_license: '12345',
  };

  const createdCertificate: MedicalCertificateResponse = {
    id: 'cert-1',
    member_id: 'member-1',
    issue_date: '2026-05-01',
    expiry_date: '2027-05-01',
    doctor_license: '12345',
    is_validated: true,
    created_at: '2026-05-01T10:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe crear el certificado cuando las validaciones pasan y el socio existe', async () => {
    vi.mocked(mockMedicalCertificateValidator.validateDoctorLicense).mockReturnValueOnce(undefined);
    vi.mocked(mockMedicalCertificateValidator.validateIssueDate).mockReturnValueOnce(undefined);
    vi.mocked(mockMedicalCertificateValidator.validateExpiryDate).mockReturnValueOnce(undefined);
    vi.mocked(mockMemberRepository.findById).mockResolvedValueOnce({ id: 'member-1' } as any);
    vi.mocked(mockMedicalCertificateRepository.createWithInvalidation).mockResolvedValueOnce(createdCertificate);

    const result = await useCase.execute(request);

    expect(mockMedicalCertificateValidator.validateDoctorLicense).toHaveBeenCalledWith('12345');
    expect(mockMedicalCertificateValidator.validateIssueDate).toHaveBeenCalledWith('2026-05-01');
    expect(mockMedicalCertificateValidator.validateExpiryDate).toHaveBeenCalledWith('2026-05-01', '2027-05-01');
    expect(result).toEqual(createdCertificate);
    expect(mockMedicalCertificateRepository.createWithInvalidation).toHaveBeenCalledWith(request);
  });

  it('debe lanzar error si el socio no existe', async () => {
    vi.mocked(mockMedicalCertificateValidator.validateDoctorLicense).mockReturnValueOnce(undefined);
    vi.mocked(mockMedicalCertificateValidator.validateIssueDate).mockReturnValueOnce(undefined);
    vi.mocked(mockMedicalCertificateValidator.validateExpiryDate).mockReturnValueOnce(undefined);
    vi.mocked(mockMemberRepository.findById).mockResolvedValueOnce(null);

    await expect(useCase.execute(request)).rejects.toThrow('El socio especificado no existe');
    expect(mockMedicalCertificateRepository.createWithInvalidation).not.toHaveBeenCalled();
  });

  it('debe detener la ejecución si falla la validación de matrícula', async () => {
    vi.mocked(mockMedicalCertificateValidator.validateDoctorLicense).mockImplementationOnce(() => {
      throw new Error('Matrícula inválida');
    });

    await expect(useCase.execute(request)).rejects.toThrow('Matrícula inválida');
    expect(mockMedicalCertificateValidator.validateIssueDate).not.toHaveBeenCalled();
    expect(mockMedicalCertificateRepository.createWithInvalidation).not.toHaveBeenCalled();
  });

  it('debe lanzar error si la fecha de emisión es posterior a la fecha de vencimiento', async () => {
    vi.mocked(mockMedicalCertificateValidator.validateDoctorLicense).mockReturnValueOnce(undefined);
    vi.mocked(mockMedicalCertificateValidator.validateIssueDate).mockReturnValueOnce(undefined);
    vi.mocked(mockMedicalCertificateValidator.validateExpiryDate).mockImplementationOnce(() => {
      throw new Error('La fecha de emisión no puede ser posterior a la fecha de vencimiento');
    });

    await expect(useCase.execute({
      ...request,
      issue_date: '2027-06-01',
      expiry_date: '2027-05-01',
    })).rejects.toThrow('La fecha de emisión no puede ser posterior a la fecha de vencimiento');
    expect(mockMedicalCertificateValidator.validateExpiryDate).toHaveBeenCalledWith('2027-06-01', '2027-05-01');
    expect(mockMemberRepository.findById).not.toHaveBeenCalled();
    expect(mockMedicalCertificateRepository.createWithInvalidation).not.toHaveBeenCalled();
  });
});
