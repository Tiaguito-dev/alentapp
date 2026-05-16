import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateSportUseCase } from '../application/SportUseCases/NewSportUseCase.js';
import { CreateSportRequest } from '@alentapp/shared';

export class SportController {
    constructor(
        private readonly createSportUseCase: CreateSportUseCase,
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
}