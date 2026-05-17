import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateDisciplineUseCase } from '../application/DisciplineUseCases/CreateDisciplineUseCase.js';
import { ListDisciplinesUseCase } from '../application/DisciplineUseCases/ListDisciplineUseCase.js';
import { GetDisciplineByIdUseCase } from '../application/DisciplineUseCases/GetDisciplineByIdUseCase.js'; // <-- Import nuevo
import { CreateDisciplineRequest } from '@alentapp/shared';

export class DisciplineController {
    constructor(
        private readonly createDisciplineUseCase: CreateDisciplineUseCase,
        private readonly listDisciplinesUseCase: ListDisciplinesUseCase,
        private readonly getDisciplineByIdUseCase: GetDisciplineByIdUseCase, // <-- Inyección nueva
    ) {}

    async create(
        request: FastifyRequest<{ Body: CreateDisciplineRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const discipline = await this.createDisciplineUseCase.execute(request.body);
            return reply.status(201).send({ data: discipline });
        } catch (error: any) {
            if (
                error.message.includes('mayor a la de inicio') || 
                error.message.includes('obligatorio') || 
                error.message.includes('inválido')
            ) {
                return reply.status(400).send({ error: error.message });
            }
            return reply.status(500).send({ error: "Error interno, reintente más tarde" });
        }
    }

    async getAll(request: FastifyRequest, reply: FastifyReply) {
        try {
            const disciplines = await this.listDisciplinesUseCase.execute();
            return reply.status(200).send(disciplines);
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({ error: "Error interno, reintente más tarde" });
        }
    }

    // NUEVO: Método para traer por ID con tipado de params de Fastify
    async getById(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        try {
            const { id } = request.params;
            const discipline = await this.getDisciplineByIdUseCase.execute(id);

            if (!discipline) {
                return reply.status(404).send({ error: 'Disciplina no encontrada' });
            }

            return reply.status(200).send(discipline);
        } catch (error: any) {
            request.log.error(error);
            return reply.status(500).send({ error: "Error interno, reintente más tarde" });
        }
    }
}