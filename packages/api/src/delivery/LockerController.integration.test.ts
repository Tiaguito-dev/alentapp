import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { UpdateLockerRequest } from '@alentapp/shared';

// Mockeamos solo los métodos del repositorio que usa el UpdateLockerUseCase
vi.mock('../infrastructure/PostgresLockerRepository.js', () => {
  return {
    PostgresLockerRepository: class {
      async findByNumber(number: number) {
        if (number === 10) return { number: 10, status: 'Available', member_id: null };
        if (number === 20) return { number: 20, status: 'Occupied', member_id: 'socio-999' };
        return null;
      }
      async findByMemberId(memberId: string) {
        if (memberId === 'socio-123') return { number: 5, status: 'Occupied', member_id: 'socio-123' };
        return null;
      }
      async update(number: number, data: any) {
        return { number, ...data };
      }
    }
  };
});

describe('Locker API Integration Tests - Solo Update', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('PATCH /api/v1/lockers/:number', () => {
    
    it('debe retornar 200 y asignar el casillero correctamente', async () => {
      const payload: UpdateLockerRequest = { member_id: 'socio-nuevo' };

      const response = await app.inject({
        method: 'PATCH', 
        url: '/api/v1/lockers/10',
        payload
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.status).toBe('Occupied'); 
      expect(body.member_id).toBe('socio-nuevo');
    });

    it('debe retornar 400 si el socio ya tiene otro casillero', async () => {
      const payload: UpdateLockerRequest = { member_id: 'socio-123' };

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/lockers/10',
        payload
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('ya tiene un casillero asignado');
    });

    it('debe retornar 409 si se intenta romper el casillero ocupándolo otro socio', async () => {
      const payload: UpdateLockerRequest = { member_id: 'socio-nuevo' };

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/v1/lockers/20', // El 20 está mockeado como ocupado por 'socio-999'
        payload
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('El casillero ya está asignado a otro socio. Desasígnelo primero.'); 
    });

  });
});