import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateSportUseCase } from '../application/SportUseCases/NewSportUseCase.js';
import { UpdateSportUseCase } from '../application/SportUseCases/UpdateSportUseCase.js';
import { CreateSportRequest, UpdateSportRequest } from '@alentapp/shared';

export class SportController {
    constructor(
        private readonly createSportUseCase: CreateSportUseCase,
        private readonly updateSportUseCase: UpdateSportUseCase,
    ) { }

    async create(
        request: FastifyRequest<{ Body: CreateSportRequest }>,
        reply: FastifyReply,
    ) {
        try {
            request.log.info('Alguien pegó al endpoint de create sport');
            const sport = await this.createSportUseCase.execute(request.body);
            return reply.status(201).send({ data: sport });
        } catch (error: any) {
            if (error.message.includes('Nombre inválido')) {
                return reply.status(409).send({ error: error.message });
            }
            if (error.message.includes('Número inválido')) {
                return reply.status(400).send({ error: error.message });
            }
            return reply.status(500).send({ error: "Error interno, reintente más tarde" });
        }
    }

    async update(
        request: FastifyRequest<{ Params: { id: string }; Body: UpdateSportRequest }>,
        reply: FastifyReply,
    ) {
        try {
            const { id } = request.params;
            request.log.info('Alguien pegó al endpoint de update sport');
            const sport = await this.updateSportUseCase.execute(id, request.body);
            return reply.status(200).send({ data: sport });
        } catch (error: any) {
            if (error.message.includes('Deporte no encontrado')) {
                return reply.status(404).send({ error: error.message });
            }
            if (error.message.includes('Conflicto de solicitud')) {
                return reply.status(409).send({ error: error.message });
            }
            if (error.message.includes('Número inválido')) {
                return reply.status(400).send({ error: error.message });
            }
            return reply.status(500).send({ error: "Error interno, reintente más tarde" });
        }
    }


}