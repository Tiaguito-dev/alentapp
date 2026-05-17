import { FastifyReply, FastifyRequest } from 'fastify';
import { ListMedicalCertificatesUseCase } from '../application/MedicalCertificateUseCases/ListMedicalCertificatesUseCase.js';
import { CreateMedicalCertificateUseCase } from '../application/MedicalCertificateUseCases/CreateMedicalCertificateUseCase.js';
import { CreateMedicalCertificateRequest } from '@alentapp/shared';

const VALIDATION_ERROR_CODES = new Set([
  'INVALID_DOCTOR_LICENSE',
  'INVALID_ISSUE_DATE',
  'INVALID_EXPIRY_DATE',
  'INVALID_DATE_ORDER',
]);

export class MedicalCertificateController {
  constructor(
    private readonly createMedicalCertificateUseCase: CreateMedicalCertificateUseCase,
    private readonly listMedicalCertificatesUseCase: ListMedicalCertificatesUseCase,
  ) {}

  async create(
    request: FastifyRequest<{ Body: CreateMedicalCertificateRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const certificate = await this.createMedicalCertificateUseCase.execute(request.body);
      return reply.status(201).send({ data: certificate });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        return reply.status(404).send({ error: 'El socio especificado no existe' });
      }
      if (VALIDATION_ERROR_CODES.has(error?.code)) {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
    }
  }

  async getAll(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const certificates = await this.listMedicalCertificatesUseCase.execute();
      return reply.status(200).send({ data: certificates });
    } catch {
      return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
    }
  }
}
