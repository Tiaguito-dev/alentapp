import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateLockerRequest, UpdateLockerRequest } from '@alentapp/shared';
import { CreateLockerUseCase } from '../application/LockerUseCases/NewLockerUseCase.js';
import { UpdateLockerUseCase } from '../application/LockerUseCases/UpdateLockerUseCase.js';
import { DeleteLockerUseCase } from '../application/LockerUseCases/DeleteLockerUseCase.js';
import { ListLockersUseCase } from '../application/LockerUseCases/ListLockersUseCase.js';
import { GetLockerByNumberUseCase } from '../application/LockerUseCases/GetLockerByNumberUseCase.js';

export class LockerController {
  constructor(
    private readonly createUseCase: CreateLockerUseCase,
    private readonly updateUseCase: UpdateLockerUseCase,
    private readonly deleteUseCase: DeleteLockerUseCase,
    private readonly listUseCase: ListLockersUseCase,
    private readonly getByNumberUseCase: GetLockerByNumberUseCase
  ) {}

  // POST /api/v1/lockers (TDD-0004)
async create(request: FastifyRequest<{ Body: CreateLockerRequest }>, reply: FastifyReply) {
    try {
      // 1. Validamos el tipo de dato acá mismo (Filtro en la puerta)
      if (typeof request.body.number !== 'number' || isNaN(request.body.number)) {
        return reply.status(400).send({ error: "error de validacion" });
      }

      // 2. Si pasa, mandamos a crear el casillero
      const locker = await this.createUseCase.execute(request.body);
      return reply.status(201).send(locker);

    } catch (error: any) {
      // 3. Atrapamos errores de lógica de negocio (como el número duplicado)
      if (error.message === 'Ya existe Casillero con ese numero') {
        return reply.status(409).send({ error: error.message });
      }
      
      // Mantenemos este if por si en un futuro lanzás un "throw new Error('error de validacion')" desde alguna otra capa
      if (error.message.includes('error de validacion')) {
        return reply.status(400).send({ error: error.message });
      }
      
      return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
    }
  }

 // PATCH /api/v1/lockers/:number (TDD-0005)
  async update(request: FastifyRequest<{ Params: { number: string }, Body: UpdateLockerRequest }>, reply: FastifyReply) {
    try {
      const number = parseInt(request.params.number, 10);
      const locker = await this.updateUseCase.execute(number, request.body);
      return reply.status(200).send(locker);
    }catch (error: any) {
      
      if (error.message === 'error: casillero en mantenimiento') {
        return reply.status(422).send({ error: error.message });
      }
      
      if (error.message === 'El casillero especificado no fue encontrado') {
        return reply.status(404).send({ error: error.message });
      }
      // Atajamos si el Socio no existe (ya sea por error del UseCase o por error de base de datos de Prisma)
      if (error.code === 'P2003' || error.message.includes('Foreign key constraint') || error.message === 'error: Socio no existe') {
        return reply.status(404).send({ error: "error: Socio no existe" });
      }


      if (error.message.includes("ya tiene un casillero asignado")) {
        return reply.status(400).send({ error: error.message });
      }
      
      
      if (error.message.includes('ya está asignado') || error.message.includes('No se puede poner en mantenimiento')) {
        return reply.status(409).send({ error: error.message });
      }

  
      console.error("Error no manejado:", error); // Te dejo un console.log acá para que puedas ver en tu terminal si falla algo raro
      return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
    }
  }
  // DELETE /api/v1/lockers/:number (TDD-0006)
  async delete(request: FastifyRequest<{ Params: { number: string } }>, reply: FastifyReply) {
    try {
      const number = parseInt(request.params.number, 10);
      await this.deleteUseCase.execute(number);
      return reply.status(204).send(); // 204 No Content
    } catch (error: any) {
      if (error.message === 'El casillero especificado no fue encontrado') {
        return reply.status(404).send({ error: error.message });
      }
      if (error.message === 'No se puede eliminar un casillero ocupado por un socio') {
        return reply.status(409).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
    }
  }

  // GET /api/v1/lockers (TDD-0007)
  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      // 1. Agarramos los parámetros que vengan después del "?" en la URL
      const query = request.query as any;

      // ==========================================
      // REGLA: Status con valor no reconocido (400)
      // ==========================================
      if (query.status && !['Available', 'Occupied', 'Maintenance'].includes(query.status)) {
        return reply.status(400).send({ error: "Estado de casillero inválido" });
      }

      // ==========================================
      // REGLA: Formato de member_id inválido (400)
      // ==========================================
      if (query.member_id) {
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        if (!uuidRegex.test(query.member_id)) {
          return reply.status(400).send({ error: "Formato de ID de socio inválido" });
        }
      }

      // 2. Si todo está en orden, llamamos al Caso de Uso. 
      // (Le pasamos el 'query' por si tu UseCase ya está preparado para filtrar)
      const lockers = await this.listUseCase.execute();
      
      return reply.status(200).send(lockers);
      
    } catch (error: any) {
      return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
    }
  }

  // GET /api/v1/lockers/:number (TDD-0007)
  async getByNumber(request: FastifyRequest<{ Params: { number: string } }>, reply: FastifyReply) {
    try {
      const number = parseInt(request.params.number, 10);
      if (isNaN(number)) {
        return reply.status(400).send({ error: 'Formato de número inválido' });
      }
      
      const locker = await this.getByNumberUseCase.execute(number);
      return reply.status(200).send(locker);
    } catch (error: any) {
      if (error.message === 'El casillero especificado no fue encontrado') {
        return reply.status(404).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Error interno, reintente más tarde' });
    }
  }
}