import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { CreateMedicalCertificateRequest, UpdateMedicalCertificateRequest } from '@alentapp/shared';
import type { FastifyInstance } from 'fastify';

// Mocks de main
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
      // Métodos de update de tu rama (si los necesitas para PATCH)
      async findById(id: string) {
        if (id === 'cert-1') return {
          id: 'cert-1',
          member_id: 'member-1',
          issue_date: '2026-05-01',
          expiry_date: '2027-05-01',
          doctor_license: '12345',
          is_validated: true,
          created_at: '2026-05-01T00:00:00.000Z',
        };
        if (id === 'cert-invalid') return {
          id: 'cert-invalid',
          member_id: 'member-1',
          issue_date: '2026-05-01',
          expiry_date: '2027-05-01',
          doctor_license: '12345',
          is_validated: false,
          created_at: '2026-05-01T00:00:00.000Z',
        };
        return null;
      }
      async update(id: string, data: any) {
        if (id === 'cert-1') {
          const existing = {
            id: 'cert-1',
            member_id: 'member-1',
            issue_date: '2026-05-01',
            expiry_date: '2027-05-01',
            doctor_license: '12345',
            is_validated: true,
            created_at: '2026-05-01T00:00:00.000Z',
          };
          return { ...existing, ...data };
        }
        throw new Error('El certificado no existe');
      }
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
    }
  };
});

describe('MedicalCertificate API Integration Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    process.env.DATABASE_URL = 'mock';
    const { buildApp } = await import('../app.js');
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  // --- TESTS DE CREACIÓN (main) ---
  describe('POST /api/v1/medical-certificates', () => {
    it('debe retornar 201 y crear el certificado correctamente', async () => {
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
      expect(body.error).toContain('La fecha de emisión no puede ser futura');
    });

    it('debe retornar 400 si la matrícula médica es inválida', async () => {
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
      expect(body.error).toContain('La matrícula del médico debe ser un número entero positivo');
    });
  });

  // --- AGREGA AQUÍ LOS TESTS DE UPDATE DE TU RAMA ---
  describe('PATCH /api/v1/medical-certificates/:id', () => {
    it('debe retornar 200 y actualizar el certificado', async () => {
      const payload: UpdateMedicalCertificateRequest = {
        doctor_license: '54321',
      };
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/medical-certificates/cert-1',
        payload,
      });
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data.doctor_license).toBe('54321');
    });

    it('debe retornar 404 si el certificado no existe', async () => {
      const payload: UpdateMedicalCertificateRequest = {
        doctor_license: '54321',
      };
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/medical-certificates/cert-404',
        payload,
      });
      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('El certificado no existe');
    });

    it('debe retornar 409 si el certificado está invalidado', async () => {
      const payload: UpdateMedicalCertificateRequest = {
        doctor_license: '54321',
      };
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/medical-certificates/cert-invalid',
        payload,
      });
      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('No se puede modificar un certificado invalidado');
    });

    it('debe retornar 400 si no se provee ningún campo a modificar', async () => {
      const payload: UpdateMedicalCertificateRequest = {};
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/medical-certificates/cert-1',
        payload,
      });
      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('Debe proveer al menos un campo a modificar');
    });
  });

  // --- TESTS DE LECTURA (READ) ---
  describe('GET /api/v1/medical-certificates/:id', () => {
    it('debe retornar 200 y el certificado solicitado', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/medical-certificates/cert-1',
      });
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data.id).toBe('cert-1');
      expect(body.data.member_id).toBe('member-1');
    });

    it('debe retornar 404 si el certificado no existe', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/medical-certificates/cert-404',
      });
      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('El certificado no existe');
    });
  });
});
