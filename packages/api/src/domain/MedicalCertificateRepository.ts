import { MedicalCertificateResponse, CreateMedicalCertificateRequest } from '@alentapp/shared';

export interface MedicalCertificateRepository {
  create(data: CreateMedicalCertificateRequest): Promise<MedicalCertificateResponse>;
  findById(id: string): Promise<MedicalCertificateResponse | null>;
  findAll(): Promise<MedicalCertificateResponse[]>;
}
