import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client.js';
import { DisciplineRepository } from '../domain/DisciplineRepository.js';
import { DisciplineDTO } from '@alentapp/shared';


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

    // === NUEVO MÉTODO AGREGADO ===
    async delete(id: string): Promise<void> {
        await prisma.discipline.delete({
            where: { id },
        });
    }
}
