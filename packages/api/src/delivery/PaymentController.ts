import { FastifyRequest, FastifyReply } from 'fastify';
import { CreatePaymentUseCase } from '../application/PaymentUseCases/CreatePaymentUseCase.js';
import { UpdatePaymentUseCase } from '../application/PaymentUseCases/UpdatePaymentUseCase.js';
import { MarkPaymentAsPaidUseCase } from '../application/PaymentUseCases/MarkPaymentAsPaidUseCase.js';
import { CancelPaymentUseCase } from '../application/PaymentUseCases/CancelPaymentUseCase.js';
import { DeletePaymentUseCase } from '../application/PaymentUseCases/DeletePaymentUseCase.js';
import { ListPaymentsUseCase } from '../application/PaymentUseCases/ListPaymentsUseCase.js';
import { GetPaymentByIdUseCase } from '../application/PaymentUseCases/GetPaymentByIdUseCase.js';
import {
  CreatePaymentRequest,
  UpdatePaymentRequest,
  MarkPaymentAsPaidRequest,
} from '@alentapp/shared';

export class PaymentController {
  constructor(
    private readonly createPaymentUseCase: CreatePaymentUseCase,
    private readonly updatePaymentUseCase: UpdatePaymentUseCase,
    private readonly markPaymentAsPaidUseCase: MarkPaymentAsPaidUseCase,
    private readonly cancelPaymentUseCase: CancelPaymentUseCase,
    private readonly deletePaymentUseCase: DeletePaymentUseCase,
    private readonly listPaymentsUseCase: ListPaymentsUseCase,
    private readonly getPaymentByIdUseCase: GetPaymentByIdUseCase,
  ) {}

  async getAll(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const payments = await this.listPaymentsUseCase.execute();
      return reply.status(200).send({ data: payments });
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
      const payment = await this.getPaymentByIdUseCase.execute(id);
      return reply.status(200).send({ data: payment });
    } catch (error: any) {
      if (error.message === 'El pago no existe') {
        return reply.status(404).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
    }
  }

  async create(
    request: FastifyRequest<{ Body: CreatePaymentRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const payment = await this.createPaymentUseCase.execute(request.body);
      return reply.status(201).send({ data: payment });
    } catch (error: any) {
      if (error.message === 'El socio especificado no existe') {
        return reply.status(404).send({ error: error.message });
      }
      if (error.message.includes('Ya existe un pago activo')) {
        return reply.status(409).send({ error: error.message });
      }
      if (
        error.message.includes('monto') ||
        error.message.includes('mes') ||
        error.message.includes('año') ||
        error.message.includes('fecha')
      ) {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
    }
  }

  async update(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdatePaymentRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;
      const payment = await this.updatePaymentUseCase.execute(id, request.body);
      return reply.status(200).send({ data: payment });
    } catch (error: any) {
      if (error.message === 'El pago no existe') {
        return reply.status(404).send({ error: error.message });
      }
      if (error.message.includes('No se puede modificar')) {
        return reply.status(409).send({ error: error.message });
      }
      if (
        error.message.includes('campo') ||
        error.message.includes('monto') ||
        error.message.includes('fecha')
      ) {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
    }
  }

  async markAsPaid(
    request: FastifyRequest<{ Params: { id: string }; Body: MarkPaymentAsPaidRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;
      const payment = await this.markPaymentAsPaidUseCase.execute(id, request.body);
      return reply.status(200).send({ data: payment });
    } catch (error: any) {
      if (error.message === 'El pago no existe') {
        return reply.status(404).send({ error: error.message });
      }
      if (
        error.message.includes('ya fue marcado') ||
        error.message.includes('No se puede marcar')
      ) {
        return reply.status(409).send({ error: error.message });
      }
      if (error.message.includes('fecha')) {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
    }
  }

  async cancel(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;
      const payment = await this.cancelPaymentUseCase.execute(id);
      return reply.status(200).send({ data: payment });
    } catch (error: any) {
      if (error.message === 'El pago no existe') {
        return reply.status(404).send({ error: error.message });
      }
      if (error.message.includes('No se puede cancelar')) {
        return reply.status(409).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
    }
  }

  async delete(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const { id } = request.params;
      await this.deletePaymentUseCase.execute(id);
      return reply.status(204).send();
    } catch (error: any) {
      if (error.message === 'El pago no existe') {
        return reply.status(404).send({ error: error.message });
      }
      if (error.message.includes('No se puede dar de baja')) {
        return reply.status(409).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
    }
  }
}