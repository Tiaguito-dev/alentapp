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

    describe('PATCH /api/v1/payments/:id', () => {
        it('debe retornar 200 y el pago actualizado', async () => {
            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/payments/1',
                payload: { amount: 2000 },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data.amount).toBe(2000);
        });

        it('debe retornar 404 si el pago no existe', async () => {
            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/payments/999',
                payload: { amount: 2000 },
            });

            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.payload);
            expect(body.error).toBe('El pago no existe');
        });
    });

    describe('PATCH /api/v1/payments/:id/pay', () => {
        it('debe retornar 200 y marcar el pago como pagado', async () => {
            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/payments/1/pay',
                payload: {},
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data.status).toBe('Paid');
        });
    });

    describe('PATCH /api/v1/payments/:id/cancel', () => {
        it('debe retornar 200 y cancelar el pago', async () => {
            const response = await app.inject({
                method: 'PATCH',
                url: '/api/v1/payments/1/cancel',
                payload: {},
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.payload);
            expect(body.data.status).toBe('Canceled');
        });
    });
});

