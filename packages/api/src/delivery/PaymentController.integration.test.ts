import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../app.js';
import { CreatePaymentRequest } from '@alentapp/shared';

//acá mockeamos la implementación o adaptador de salida para no tener que depender de la BD
vi.mock('../infrastructure/PostgresPaymentRepository.js', () => {
    return {
        PostgresPaymentRepository: class {
            async findAll() { return []; }
            async findById(id: string) { return null; }
            async existsActiveForPeriod(member_id: string, month: number, year: number) {
                return member_id === 'member-1' && month === 5 && year === 2026;
            }
            async create(data: any) {
                return { id: '2', ...data, status: 'Pending', payment_date: null };
            }
            async update(id: string, data: any) { return { id, ...data }; }
        },
    };
});

vi.mock('../infrastructure/PostgresMemberRepository.js', () => {
    return {
        PostgresMemberRepository: class {
            async findAll() { return []; }
            async findById(id: string) {
                return id === 'member-1' ? { id: 'member-1', name: 'Socio Test' } : null;
            }
            async findByDni() { return null; }
            async create(data: any) { return { id: '1', ...data }; }
            async update(id: string, data: any) { return { id, ...data }; }
            async delete() { return; }
        },
    };
});

describe('Payment API Integration Tests', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = buildApp();
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /api/v1/payments', () => {
        it('debe retornar 201 y crear el pago con status Pending', async () => {
            const payload: CreatePaymentRequest = {
                member_id: 'member-1',
                amount: 1500,
                month: 6,
                year: 2026,
                due_date: '2026-06-30',
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/payments',
                payload,
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.payload);
            expect(body.data.status).toBe('Pending');
            expect(body.data.member_id).toBe('member-1');
        });

        it('debe retornar 409 si ya existe un pago activo para el período', async () => {
            const payload: CreatePaymentRequest = {
                member_id: 'member-1',
                month: 5,
                year: 2026,
                amount: 1500,
                due_date: '2026-05-31',
            };

            const response = await app.inject({
                method: 'POST',
                url: '/api/v1/payments',
                payload,
            });

            expect(response.statusCode).toBe(409);
            const body = JSON.parse(response.payload);
            expect(body.error).toContain('Ya existe un pago activo');
        });
    });
});