import { FastifyReply, FastifyRequest } from 'fastify';
import { ListMedicalCertificatesUseCase } from '../application/MedicalCertificateUseCases/ListMedicalCertificatesUseCase.js';
import { GetMedicalCertificateByIdUseCase } from '../application/MedicalCertificateUseCases/GetMedicalCertificateByIdUseCase.js';
import { CreateMedicalCertificateUseCase } from '../application/MedicalCertificateUseCases/CreateMedicalCertificateUseCase.js';
import { CreateMedicalCertificateRequest } from '@alentapp/shared';

export class MedicalCertificateController {
  constructor(
    private readonly createMedicalCertificateUseCase: CreateMedicalCertificateUseCase,
    private readonly listMedicalCertificatesUseCase: ListMedicalCertificatesUseCase,
    private readonly getMedicalCertificateByIdUseCase: GetMedicalCertificateByIdUseCase,
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
      if (
        error?.message?.includes('issue_date') ||
        error?.message?.includes('expiry_date') ||
        error?.message?.includes('doctor_license')
      ) {
        return reply.status(400).send({ error: 'Datos inválidos para crear el certificado médico' });
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

  async getById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;
      const certificate = await this.getMedicalCertificateByIdUseCase.execute(id);
      return reply.status(200).send({ data: certificate });
    } catch (error: any) {
      if (error.message === 'El certificado no existe') {
        return reply.status(404).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
    }
  }
}
