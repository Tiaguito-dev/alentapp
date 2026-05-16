import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js'; 
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineDTO } from '@alentapp/shared';

export class PostgresDisciplineRepository implements DisciplineRepository {
  
  
  private prisma = new PrismaClient();

  
  constructor() {}

  async create(discipline: Omit<DisciplineDTO, 'id'> & { member_id: string }): Promise<DisciplineDTO> {
    const created = await this.prisma.discipline.create({
      data: {
        name: discipline.name,
        description: discipline.description,
        start_date: new Date(discipline.start_date),
        end_date: new Date(discipline.end_date),
        is_total_suspension: discipline.is_total_suspension,
        member_id: discipline.member_id,
      },
    });

    return {
      id: created.id,
      name: created.name,
      description: created.description,
      start_date: created.start_date.toISOString(),
      end_date: created.end_date.toISOString(),
      is_total_suspension: created.is_total_suspension,
    };
  }
}