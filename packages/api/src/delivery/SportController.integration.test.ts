import { describe, it, vi, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../app.js";
import type { FastifyInstance } from "fastify";
import type { SportDTO, CreateSportRequest, UpdateSportRequest } from "@alentapp/shared";

const mockSportDTO1: SportDTO = {
    id: '1',
    name: 'Tenis',
    description: 'El deporte mas popular',
    max_capacity: 10,
    additional_price: 10,
    requires_medical_certificate: true,
    created_at: '2022-01-01T00:00:00.000Z',
}

const mockSportDTO2: SportDTO = {
    id: '2',
    name: 'Futbol',
    description: 'El deporte mas popular',
    max_capacity: 10,
    additional_price: 10,
    requires_medical_certificate: true,
    created_at: '2022-01-01T00:00:00.000Z',
}

vi.mock('../infrastructure/PostgresSportRepository.ts', () => {
    return {
        PostgresSportRepository: class {
            async getAll() { return [mockSportDTO1, mockSportDTO2]; }
            async findById(id: string) {
                if (id === '1') return mockSportDTO1;
                return null;
            }
            async findByName(name: string) { return name === 'Tenis' ? mockSportDTO1 : null; }
            async create(data: CreateSportRequest) { return mockSportDTO2; }
            async update(id: string, data: UpdateSportRequest) {
                if (id === '1') return { ...mockSportDTO1, ...data };
            }
            async delete(id: string) {
                if (id === '1') return;
            }
            async isDeleted(id: string) {
                if (id === '1') return false;
            }
        }
    };
});

describe('Sport API Integration Tests', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = buildApp();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /api/v1/sports', () => {
        it('debe retornar 201 y crear el deporte', async () => {
            const payload = {
                name: 'Futbol',
                description: 'El deporte mas popular',
                max_capacity: 10,
                additional_price: 10,
                requires_medical_certificate: true,
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/sports',
                payload
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.payload);
            expect(body.data.id).toBeDefined();
            expect(body.data.name).toBe('Futbol');
            expect(body.data.description).toBe('El deporte mas popular');
            expect(body.data.max_capacity).toBe(10);
            expect(body.data.additional_price).toBe(10);
            expect(body.data.requires_medical_certificate).toBe(true);
        });

        it('debe retornar 409 si el deporte ya existe', async () => {
            const payload = {
                name: 'Tenis',
                description: 'Otro deporte',
                max_capacity: 10,
                additional_price: 10,
                requires_medical_certificate: true,
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/sports',
                payload
            });

            expect(response.statusCode).toBe(409);
        });
    });

    describe('GET /api/v1/sports', () => {
        it('debe retornar 200 y el listado de sports', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/sports'
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data).toBeInstanceOf(Array);
            expect(body.data.length).toBe(2);
            expect(body.data[0].id).toBe('1');
            expect(body.data[0].name).toBe('Tenis');
            expect(body.data[1].id).toBe('2');
            expect(body.data[1].name).toBe('Futbol');
        });
    });

    describe('GET /api/v1/sports/:id', () => {
        it('debe retornar 200 y el deporte correspondiente', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/sports/1'
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data.id).toBe('1');
            expect(body.data.name).toBe('Tenis');
        });

        it('debe retornar 404 si el deporte no existe', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/api/v1/sports/999'
            });

            expect(response.statusCode).toBe(404);
        });
    });

    describe('PATCH /api/v1/sports/:id', () => {
        it('debe retornar 200 y el deporte actualizado', async () => {
            const payload = {
                max_capacity: 11,
                additional_price: 11,
            };

            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/sports/1',
                payload
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data.id).toBe('1');
            expect(body.data.max_capacity).toBe(11);
            expect(body.data.additional_price).toBe(11);
        });

        it('debe retornar 404 si el deporte no existe', async () => {

            const payload = {
                max_capacity: 11,
                additional_price: 11,
            };

            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/sports/999',
                payload
            });

            expect(response.statusCode).toBe(404);
        });

        it('debe retornar 409 si quiere actualizar el nombre de un deporte ya existente', async () => {
            const payload = {
                name: 'Tenis actualizado'
            };

            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/sports/1',
                payload
            });

            expect(response.statusCode).toBe(409);
        });
    });

    describe('DELETE /api/v1/sports/:id', () => {
        it('debe retornar 200 si se elimina correctamente', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/sports/1'
            });

            expect(response.statusCode).toBe(200);
        });

        it('debe retornar 404 si el deporte no existe', async () => {
            const response = await app.inject({
                method: 'DELETE',
                url: '/api/v1/sports/999'
            });

            expect(response.statusCode).toBe(404);
        });
    });
});