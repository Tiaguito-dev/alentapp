import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateDisciplineUseCase } from '../application/DisciplineUseCases/CreateDisciplineUseCase.js';
import { ListDisciplinesUseCase } from '../application/DisciplineUseCases/ListDisciplineUseCase.js';
import { GetDisciplineByIdUseCase } from '../application/DisciplineUseCases/GetDisciplineByIdUseCase.js';
import { DeleteDisciplineUseCase } from '../application/DisciplineUseCases/DeleteDisciplineUseCase.js'; // <-- Import para delete
import { CreateDisciplineRequest } from '@alentapp/shared';

// Si armaste el validador, lo importás acá. Si no, borrá esta línea:
// import { DeleteDisciplineValidator } from '../application/Validators/DeleteDisciplineValidator.js'; 

export class DisciplineController {
    constructor(
        private readonly createDisciplineUseCase: CreateDisciplineUseCase,
        private readonly listDisciplinesUseCase: ListDisciplinesUseCase,
        private readonly getDisciplineByIdUseCase: GetDisciplineByIdUseCase,
        private readonly deleteDisciplineUseCase: DeleteDisciplineUseCase // <-- Inyección nueva
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

    // NUEVO: Método para eliminar la disciplina por ID
    async delete(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        try {
            const { id } = request.params;

            // Si creaste el validador, lo usás acá descomentando esto:
            // DeleteDisciplineValidator.validate(id);

            await this.deleteDisciplineUseCase.execute(id);

            // Respondemos 204 sin cuerpo
            return reply.status(204).send();
        } catch (error: any) {
            if (error.message.includes('no existe')) {
                return reply.status(404).send({ error: error.message });
            }
            // Por si usamos el validador y salta algún error de formato UUID
            if (error.message.includes('inválido') || error.message.includes('obligatorio')) {
                return reply.status(400).send({ error: error.message });
            }
            
            request.log.error(error);
            return reply.status(500).send({ error: "Error interno, reintente más tarde" });
        }
    }
}