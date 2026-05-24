import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { UpdateLockerRequest, CreateLockerRequest } from '@alentapp/shared';

// Mockeamos el repositorio para cubrir las necesidades de Update y Create
vi.mock('../infrastructure/PostgresLockerRepository.js', () => {
  return {
    PostgresLockerRepository: class {
      async findByNumber(number: number) {
        if (number === 10) return { number: 10, status: 'Available', member_id: null };
        if (number === 20) return { number: 20, status: 'Occupied', member_id: 'socio-999' };
        return null; // Cualquier otro número (ej: 30) cuenta como libre/no existe
      }
      async findByMemberId(memberId: string) {
        if (memberId === 'socio-123') return { number: 5, status: 'Occupied', member_id: 'socio-123' };
        return null;
      }
      async update(number: number, data: any) {
        return { number, ...data };
      }
      async create(data: any) {
        return { id: 'uuid-mock', member_id: null, ...data };
      }
    }
  };
});

describe('Locker API Integration Tests - Create & Update', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  // ====================================================================
  // TESTS DE INTEGRACIÓN - CREATE
  // ====================================================================
  describe('POST /api/v1/lockers', () => {
    
    it('debe retornar 201 y crear el casillero correctamente si está libre y es Available', async () => {
      const payload: CreateLockerRequest = { 
        number: 30, // Usamos el 30 porque en el mock devuelve null (está libre)
        location: 'Vestuario B', 
        status: 'Available' 
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/lockers',
        payload
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.payload);
      expect(body.number).toBe(30);
      expect(body.status).toBe('Available');
      expect(body.location).toBe('Vestuario B');
    });

    it('debe retornar 409 si ya existe un casillero con ese número', async () => {
      const payload: CreateLockerRequest = { 
        number: 10, // El 10 ya existe en nuestro mock
        location: 'Vestuario B', 
        status: 'Available' 
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/lockers',
        payload
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('Ya existe Casillero con ese numero');
    });

    it('debe retornar 400 si el estado inicial no es Available', async () => {
      const payload: CreateLockerRequest = { 
        number: 40, 
        location: 'Vestuario B', 
        status: 'Occupied' // Forzamos el error del Validador
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/lockers',
        payload
      });

      
      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toBe('error de validacion: El estado inicial debe ser Available');
    });
  });

  // ====================================================================
  // TESTS DE INTEGRACIÓN - UPDATE
  // ====================================================================
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