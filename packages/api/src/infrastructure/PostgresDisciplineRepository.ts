import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineDTO } from '@alentapp/shared';
import { UpdateDisciplineRequest } from '../application/DisciplineUseCases/UpdateDisciplineUseCase.js';


if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}


const prisma = new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL),
});

export class PostgresDisciplineRepository implements DisciplineRepository {
    
    constructor() {}

    
    async create(discipline: Omit<DisciplineDTO, 'id'> & { member_id: string }): Promise<DisciplineDTO> {
        const created = await prisma.discipline.create({
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

    
    async findAll(): Promise<DisciplineDTO[]> {
        const disciplines = await prisma.discipline.findMany({
            orderBy: { start_date: 'desc' }, 
        });

        return disciplines.map(discipline => ({
            id: discipline.id,
            name: discipline.name,
            description: discipline.description,
            start_date: discipline.start_date.toISOString(),
            end_date: discipline.end_date.toISOString(),
            is_total_suspension: discipline.is_total_suspension,
        }));

    }


    async findById(id: string): Promise<DisciplineDTO | null> {
        const discipline = await prisma.discipline.findUnique({
            where: { id },
        });

        if (!discipline) return null;

        return {
            id: discipline.id,
            name: discipline.name,
            description: discipline.description,
            start_date: discipline.start_date.toISOString(),
            end_date: discipline.end_date.toISOString(),
            is_total_suspension: discipline.is_total_suspension,
        };
    }


    async delete(id: string): Promise<void> {
        await prisma.discipline.delete({
            where: { id },
        });
    }

    
    async update(id: string, data: UpdateDisciplineRequest): Promise<DisciplineDTO> {
        const updated = await prisma.discipline.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                
                start_date: data.start_date ? new Date(data.start_date) : undefined,
                end_date: data.end_date ? new Date(data.end_date) : undefined,
                is_total_suspension: data.is_total_suspension,
            },
        });

        return {
            id: updated.id,
            name: updated.name,
            description: updated.description,
            start_date: updated.start_date.toISOString(),
            end_date: updated.end_date.toISOString(),
            is_total_suspension: updated.is_total_suspension,
        };
    }
}