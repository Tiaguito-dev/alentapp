import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { UpdateMedicalCertificateRequest, CreateMedicalCertificateRequest } from '@alentapp/shared';

// Mock del repositorio para evitar dependencia real de BD
vi.mock('../infrastructure/PostgresMedicalCertificateRepository.js', () => {
  return {
    PostgresMedicalCertificateRepository: class {
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
          return {
            id: 'cert-1',
            member_id: 'member-1',
            issue_date: data.issue_date || '2026-05-01',
            expiry_date: data.expiry_date || '2027-05-01',
            doctor_license: data.doctor_license || '12345',
            is_validated: true,
            created_at: '2026-05-01T00:00:00.000Z',
          };
        }
        throw new Error('El certificado no existe');
      }
    },
  };
});

describe('MedicalCertificate API Integration Tests - UPDATE', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

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
});
