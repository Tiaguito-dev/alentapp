import {
  MedicalCertificateResponse,
  CreateMedicalCertificateRequest,
  UpdateMedicalCertificateRequest,
} from '@alentapp/shared';

export type MedicalCertificateUpdateData = UpdateMedicalCertificateRequest & {
  is_validated?: boolean;
};

export interface MedicalCertificateRepository {
  create(data: CreateMedicalCertificateRequest): Promise<MedicalCertificateResponse>;
  findById(id: string): Promise<MedicalCertificateResponse | null>;
  findAll(): Promise<MedicalCertificateResponse[]>;
  update(id: string, data: MedicalCertificateUpdateData): Promise<MedicalCertificateResponse>;
}
