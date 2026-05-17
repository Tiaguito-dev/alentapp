import {
  MedicalCertificateResponse,
  CreateMedicalCertificateRequest,
  UpdateMedicalCertificateRequest,
} from '@alentapp/shared';

export type MedicalCertificateUpdateData = UpdateMedicalCertificateRequest & {
  is_validated?: boolean;
  deleted_at?: Date;
};

export interface MedicalCertificateRepository {
  create(data: CreateMedicalCertificateRequest): Promise<MedicalCertificateResponse>;
  /**
   * Invalida el certificado activo anterior (si existe) y crea el nuevo, todo en una transacción atómica.
   */
  createWithInvalidation(data: CreateMedicalCertificateRequest): Promise<MedicalCertificateResponse>;
  /**
   * Devuelve el certificado activo (is_validated = true, deleted_at = null) de un socio, o null si no hay.
   */
  findActiveByMember(memberId: string): Promise<MedicalCertificateResponse | null>;
  /**
   * Invalida todos los certificados activos de un socio (is_validated = true, deleted_at = null).
   */
  invalidateByMember(memberId: string): Promise<void>;
  findById(id: string): Promise<MedicalCertificateResponse | null>;
  findAll(): Promise<MedicalCertificateResponse[]>;
  update(id: string, data: MedicalCertificateUpdateData): Promise<MedicalCertificateResponse>;
}
