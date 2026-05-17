import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateDisciplineUseCase } from '../application/DisciplineUseCases/CreateDisciplineUseCase.js';
import { ListDisciplinesUseCase } from '../application/DisciplineUseCases/ListDisciplineUseCase.js';
import { GetDisciplineByIdUseCase } from '../application/DisciplineUseCases/GetDisciplineByIdUseCase.js';
import { DeleteDisciplineUseCase } from '../application/DisciplineUseCases/DeleteDisciplineUseCase.js'; 
import { UpdateDisciplineUseCase } from '../application/DisciplineUseCases/UpdateDisciplineUseCase.js'; 
import { CreateDisciplineRequest, UpdateDisciplineRequest } from '@alentapp/shared';

export class DisciplineController {
    constructor(
        private readonly createDisciplineUseCase: CreateDisciplineUseCase,
        private readonly listDisciplinesUseCase: ListDisciplinesUseCase,
        private readonly getDisciplineByIdUseCase: GetDisciplineByIdUseCase,
        private readonly deleteDisciplineUseCase: DeleteDisciplineUseCase,
        private readonly updateDisciplineUseCase: UpdateDisciplineUseCase 
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

    async delete(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        try {
            const { id } = request.params;

            await this.deleteDisciplineUseCase.execute(id);
            
            return reply.status(204).send();
        } catch (error: any) {
            if (error.message.includes('no existe')) {
                return reply.status(404).send({ error: error.message });
            }
            
            if (error.message.includes('inválido') || error.message.includes('obligatorio')) {
                return reply.status(400).send({ error: error.message });
            }
            
            request.log.error(error);
            return reply.status(500).send({ error: "Error interno, reintente más tarde" });
        }
    }

    async update(
        request: FastifyRequest<{ Params: { id: string }; Body: UpdateDisciplineRequest }>, 
        reply: FastifyReply
    ) {
        try {
            const { id } = request.params;
            const body = request.body;

            
            if (!body || Object.keys(body).length === 0) {
                return reply.status(400).send({ 
                    error: 'El cuerpo de la solicitud no puede estar vacío. Debe enviar al menos un campo para actualizar.' 
                });
            }

            const updatedDiscipline = await this.updateDisciplineUseCase.execute(id, body);

            return reply.status(200).send({ data: updatedDiscipline });
        } catch (error: any) {
            
            if (
                error.message.includes('mayor a la de inicio') || 
                error.message.includes('obligatorio') || 
                error.message.includes('inválido')
            ) {
                return reply.status(400).send({ error: error.message });
            }
            
            if (error.message.includes('no existe')) {
                return reply.status(404).send({ error: error.message });
            }
            
            request.log.error(error);
            return reply.status(500).send({ error: "Error interno, reintente más tarde" });
        }
    }
}