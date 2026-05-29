import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { UpdateDisciplineRequest, CreateDisciplineRequest } from '@alentapp/shared';

vi.mock('../infrastructure/PostgresDisciplineRepository.js', () => {
  return {
    PostgresDisciplineRepository: class {
      async findById(id: string) {
        if (id === 'uuid-disciplina-1') {
          return { 
            id: 'uuid-disciplina-1', 
            name: 'Fútbol', 
            start_date: '2026-06-01T20:00:00.000Z', 
            end_date: '2026-12-31T22:00:00.000Z', 
            is_total_suspension: false, 
            member_id: 'socio-123' 
          };
        }
        return null; 
      }
      async update(id: string, data: any) {
        return { 
          id, 
          name: 'Fútbol', 
          start_date: '2026-06-01T20:00:00.000Z', 
          end_date: '2026-12-31T22:00:00.000Z', 
          is_total_suspension: false, 
          member_id: 'socio-123',
          ...data 
        };
      }
      async create(data: any) {
        return { id: 'uuid-mock', is_total_suspension: false, ...data };
      }
    }
  };
});

describe('Discipline API Integration Tests - Create & Update', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });


  describe('POST /api/v1/disciplines', () => {
    
    it('debe retornar 201 y crear la disciplina correctamente si los datos son válidos', async () => {
      const payload: CreateDisciplineRequest = { 
        name: 'Vóley', 
        start_date: '2026-06-01T10:00:00.000Z', 
        end_date: '2026-12-31T20:00:00.000Z',
        member_id: 'socio-123'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/disciplines',
        payload
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.payload);
      
      const data = body.data || body; 
      expect(data.id).toBe('uuid-mock');
      expect(data.name).toBe('Vóley');
      expect(data.is_total_suspension).toBe(false);
    });

    it('debe retornar 400 si el nombre está vacío', async () => {
      const payload: CreateDisciplineRequest = { 
        name: '', 
        start_date: '2026-06-01T10:00:00.000Z', 
        end_date: '2026-12-31T20:00:00.000Z',
        member_id: 'socio-123'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/disciplines',
        payload
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      
      expect(body.error || body.message).toMatch(/nombre/i);
    });

    it('debe retornar 400 si la fecha de fin es anterior a la de inicio', async () => {
      const payload: CreateDisciplineRequest = { 
        name: 'Básquet', 
        start_date: '2026-06-01T10:00:00.000Z', 
        end_date: '2025-01-01T10:00:00.000Z', 
        member_id: 'socio-123'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/disciplines',
        payload
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error || body.message).toMatch(/fecha/i);
    });
  });

 
  describe('PATCH /api/v1/disciplines/:id', () => {
    
    it('debe retornar 200 y actualizar la disciplina correctamente', async () => {
      const payload: UpdateDisciplineRequest = { is_total_suspension: true };

      const response = await app.inject({
        method: 'PATCH', 
        url: '/api/v1/disciplines/uuid-disciplina-1',
        payload
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      const data = body.data || body;
      expect(data.is_total_suspension).toBe(true); 
    });

    it('debe retornar 404 si la disciplina no existe en el sistema', async () => {
      const payload: UpdateDisciplineRequest = { is_total_suspension: true };

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/disciplines/id-inexistente', 
        payload
      });

      
      expect(response.statusCode).toBe(404);
    });

    it('debe retornar 400 si se intenta actualizar con fechas inconsistentes', async () => {
      
      const payload: UpdateDisciplineRequest = { end_date: '2025-01-01T00:00:00.000Z' };

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/disciplines/uuid-disciplina-1',
        payload
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error || body.message).toMatch(/fecha/i); 
    });

  });
});