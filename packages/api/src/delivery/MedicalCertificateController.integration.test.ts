// Mock del use case para simular error de socio inexistente
vi.mock('../application/MedicalCertificateUseCases/CreateMedicalCertificateUseCase.js', () => {
  return {
    CreateMedicalCertificateUseCase: class {
      async execute(data: any) {
        if (data.member_id !== 'member-1') {
          const error = new Error('El socio especificado no existe');
          (error as any).code = 'P2003';
          throw error;
        }
        return {
          id: 'cert-1',
          member_id: data.member_id,
          issue_date: data.issue_date,
          expiry_date: data.expiry_date,
          doctor_license: data.doctor_license,
          is_validated: true,
          created_at: new Date().toISOString(),
        };
      }
    }
  };
});

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { CreateMedicalCertificateRequest } from '@alentapp/shared';

// Mockeamos el repositorio y el de miembros
vi.mock('../infrastructure/PostgresMedicalCertificateRepository.js', () => {
  return {
    PostgresMedicalCertificateRepository: class {
      async create(data: any) {
        if (data.member_id !== 'member-1') {
          const error = new Error('El socio especificado no existe');
          (error as any).code = 'P2003';
          throw error;
        }
        return {
          id: 'cert-1',
          member_id: data.member_id,
          issue_date: data.issue_date,
          expiry_date: data.expiry_date,
          doctor_license: data.doctor_license,
          is_validated: true,
          created_at: new Date().toISOString(),
        };
      }
      async createWithInvalidation(data: any) {
        if (data.member_id !== 'member-1') {
          const error = new Error('El socio especificado no existe');
          (error as any).code = 'P2003';
          throw error;
        }
        return {
          id: 'cert-2',
          member_id: data.member_id,
          issue_date: data.issue_date,
          expiry_date: data.expiry_date,
          doctor_license: data.doctor_license,
          is_validated: true,
          created_at: new Date().toISOString(),
        };
      }
      // ...otros métodos mockeados si es necesario
    }
  };
});

vi.mock('../infrastructure/PostgresMemberRepository.js', () => {
  return {
    PostgresMemberRepository: class {
      async findById(id: string) {
        if (id === 'member-1') return { id: 'member-1', name: 'Socio Test' };
        return null;
      }
      // ...otros métodos mockeados si es necesario
    }
  };
});

describe('MedicalCertificate API Integration Tests', () => {

  let app;

  beforeAll(async () => {
    process.env.DATABASE_URL = 'mock';
    const { buildApp } = await import('../app.js');
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/medical-certificates', () => {
    it('debe retornar 201 y crear el certificado correctamente', async () => {
      // Restaurar cualquier mock previo
      const { CreateMedicalCertificateUseCase } = await import('../application/MedicalCertificateUseCases/CreateMedicalCertificateUseCase.js');
      if ((CreateMedicalCertificateUseCase.prototype.execute as any).mockRestore) {
        (CreateMedicalCertificateUseCase.prototype.execute as any).mockRestore();
      }
      const payload: CreateMedicalCertificateRequest = {
        member_id: 'member-1',
        issue_date: '2026-05-01',
        expiry_date: '2027-05-01',
        doctor_license: '12345',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/medical-certificates',
        payload,
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.payload);
      expect(body.data.member_id).toBe('member-1');
      expect(body.data.doctor_license).toBe('12345');
      expect(body.data.issue_date).toBe('2026-05-01');
      expect(body.data.expiry_date).toBe('2027-05-01');
      expect(body.data.is_validated).toBe(true);
    });

    it('debe retornar 400 si la fecha de emisión es posterior a la de vencimiento', async () => {
      const { CreateMedicalCertificateUseCase } = await import('../application/MedicalCertificateUseCases/CreateMedicalCertificateUseCase.js');
      const spy = vi.spyOn(CreateMedicalCertificateUseCase.prototype, 'execute').mockImplementationOnce(async () => {
        const error = new Error('La fecha de emisión no puede ser posterior a la fecha de vencimiento');
        (error as any).code = 'INVALID_DATE_ORDER';
        throw error;
      });

      const payload: CreateMedicalCertificateRequest = {
        member_id: 'member-1',
        issue_date: '2027-06-01',
        expiry_date: '2027-05-01',
        doctor_license: '12345',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/medical-certificates',
        payload,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toContain('fecha de emisión no puede ser posterior');
      spy.mockRestore();
    });

    it('debe retornar 400 si la matrícula médica es inválida', async () => {
      // Mock del use case para simular error de validación
      const { CreateMedicalCertificateUseCase } = await import('../application/MedicalCertificateUseCases/CreateMedicalCertificateUseCase.js');
      vi.spyOn(CreateMedicalCertificateUseCase.prototype, 'execute').mockImplementationOnce(async () => {
        const error = new Error('Matrícula inválida');
        (error as any).code = 'INVALID_DOCTOR_LICENSE';
        throw error;
      });

      const payload: CreateMedicalCertificateRequest = {
        member_id: 'member-1',
        issue_date: '2026-05-01',
        expiry_date: '2027-05-01',
        doctor_license: 'INVALID',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/medical-certificates',
        payload,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toContain('Matrícula inválida');
    });

    it('debe retornar 404 si el socio no existe', async () => {
      const payload: CreateMedicalCertificateRequest = {
        member_id: 'no-existe',
        issue_date: '2026-05-01',
        expiry_date: '2027-05-01',
        doctor_license: '12345',
      };


      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/medical-certificates',
        payload,
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.payload);
      expect(body.error).toContain('socio');
    });
  });
});
