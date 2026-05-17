import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import { MedicalCertificateResponse, CreateMedicalCertificateRequest } from '@alentapp/shared';
import { MedicalCertificateRepository } from '../domain/MedicalCertificateRepository.js';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(process.env.DATABASE_URL),
});

type DBMedicalCertificate = {
  id: string;
  member_id: string;
  issue_date: Date;
  expiry_date: Date;
  doctor_license: string;
  is_validated: boolean;
  created_at: Date;
  deleted_at: Date | null;
};

export class PostgresMedicalCertificateRepository implements MedicalCertificateRepository {
  async create(data: CreateMedicalCertificateRequest): Promise<MedicalCertificateResponse> {
    const certificate = await prisma.medicalCertificate.create({
      data: {
        member_id: data.member_id,
        issue_date: new Date(data.issue_date),
        expiry_date: new Date(data.expiry_date),
        doctor_license: data.doctor_license,
      },
    });

    return this.mapToDTO(certificate);
  }

  async findById(id: string): Promise<MedicalCertificateResponse | null> {
    const certificate = await prisma.medicalCertificate.findFirst({
      where: {
        id,
        deleted_at: null,
      },
    });

    return certificate ? this.mapToDTO(certificate) : null;
  }

  async findAll(): Promise<MedicalCertificateResponse[]> {
    const certificates = await prisma.medicalCertificate.findMany({
      where: {
        deleted_at: null,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return certificates.map((certificate) => this.mapToDTO(certificate));
  }

  private mapToDTO(certificate: DBMedicalCertificate): MedicalCertificateResponse {
    return {
      id: certificate.id,
      member_id: certificate.member_id,
      issue_date: certificate.issue_date.toISOString().split('T')[0],
      expiry_date: certificate.expiry_date.toISOString().split('T')[0],
      doctor_license: certificate.doctor_license,
      is_validated: certificate.is_validated,
      created_at: certificate.created_at.toISOString(),
    };
  }
}
