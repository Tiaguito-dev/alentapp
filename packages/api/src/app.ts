import Fastify from 'fastify';
import cors from '@fastify/cors';

import { PostgresMemberRepository } from './infrastructure/PostgresMemberRepository.js';
import { MemberValidator } from './domain/services/MemberValidator.js';
import { CreateMemberUseCase } from './application/NewMemberUseCase.js';
import { GetMembersUseCase } from './application/GetMembersUseCase.js';
import { UpdateMemberUseCase } from './application/UpdateMemberUseCase.js';
import { DeleteMemberUseCase } from './application/DeleteMemberUseCase.js';
import { MemberController } from './delivery/MemberController.js';

// --- Imports de Locker ---
import { PostgresLockerRepository } from './infrastructure/PostgresLockerRepository.js'; 
import { CreateLockerUseCase } from './application/LockerUseCases/NewLockerUseCase.js';
import { UpdateLockerUseCase } from './application/LockerUseCases/UpdateLockerUseCase.js';
import { DeleteLockerUseCase } from './application/LockerUseCases/DeleteLockerUseCase.js';
import { ListLockersUseCase } from './application/LockerUseCases/ListLockersUseCase.js';
import { GetLockerByNumberUseCase } from './application/LockerUseCases/GetLockerByNumberUseCase.js';
import { LockerController } from './delivery/LockerController.js'; 

import { PostgresPaymentRepository } from './infrastructure/PostgresPaymentRepository.js';
import { PaymentValidator } from './domain/services/PaymentValidator.js';
import { CreatePaymentUseCase } from './application/PaymentUseCases/CreatePaymentUseCase.js';
import { UpdatePaymentUseCase } from './application/PaymentUseCases/UpdatePaymentUseCase.js';
import { MarkPaymentAsPaidUseCase } from './application/PaymentUseCases/MarkPaymentAsPaidUseCase.js';
import { CancelPaymentUseCase } from './application/PaymentUseCases/CancelPaymentUseCase.js';
import { DeletePaymentUseCase } from './application/PaymentUseCases/DeletePaymentUseCase.js';
import { ListPaymentsUseCase } from './application/PaymentUseCases/ListPaymentsUseCase.js';
import { GetPaymentByIdUseCase } from './application/PaymentUseCases/GetPaymentByIdUseCase.js';
import { PaymentController } from './delivery/PaymentController.js';


// --- Imports de Medical Certificate ---
import { PostgresMedicalCertificateRepository } from './infrastructure/PostgresMedicalCertificateRepository.js';
import { CreateMedicalCertificateUseCase } from './application/MedicalCertificateUseCases/CreateMedicalCertificateUseCase.js';
import { ListMedicalCertificatesUseCase } from './application/MedicalCertificateUseCases/ListMedicalCertificatesUseCase.js';
import { GetMedicalCertificateByIdUseCase } from './application/MedicalCertificateUseCases/GetMedicalCertificateByIdUseCase.js';
import { UpdateMedicalCertificateUseCase } from './application/MedicalCertificateUseCases/UpdateMedicalCertificateUseCase.js';
import { InvalidateMedicalCertificateUseCase } from './application/MedicalCertificateUseCases/InvalidateMedicalCertificateUseCase.js';
import { DeleteMedicalCertificateUseCase } from './application/MedicalCertificateUseCases/DeleteMedicalCertificateUseCase.js';
import { MedicalCertificateController } from './delivery/MedicalCertificateController.js';

import { MedicalCertificateValidator } from './domain/services/MedicalCertificateValidator.js';


// --- IMPORTS SPORT ---
import { PostgresSportRepository } from './infrastructure/PostgresSportRepository.js';
import { SportController } from './delivery/SportController.js';
import { CreateSportUseCase } from './application/SportUseCases/NewSportUseCase.js';
import { SportValidator } from './domain/services/SportValidator.js';
import { UpdateSportUseCase } from './application/SportUseCases/UpdateSportUseCase.js';
import { DeleteSportUseCase } from './application/SportUseCases/DeleteSportUseCase.js';
import { ListSportsUseCase } from './application/SportUseCases/ListSportsUseCase.js';
import { GetSportByIdUseCase } from './application/SportUseCases/GetSportByIdUseCase.js';

// --- Imports de Discipline (Nuevos) ---
import { PostgresDisciplineRepository } from './infrastructure/PostgresDisciplineRepository.js';
import { DisciplineValidator } from './domain/services/DisciplineValidator.js';
import { CreateDisciplineUseCase } from './application/DisciplineUseCases/CreateDisciplineUseCase.js';
import { ListDisciplinesUseCase } from './application/DisciplineUseCases/ListDisciplineUseCase.js'; 
import { GetDisciplineByIdUseCase } from './application/DisciplineUseCases/GetDisciplineByIdUseCase.js'; 
import { DeleteDisciplineUseCase } from './application/DisciplineUseCases/DeleteDisciplineUseCase.js'; // <-- IMPORT DEL DELETE
import { DisciplineController } from './delivery/DisciplineController.js';


export function buildApp() {
    const server = Fastify({
        logger: {
            level: 'info',
            transport: process.env.NODE_ENV === 'development'
                ? {
                    target: 'pino-pretty',
                    options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' },
                }
                : undefined,
        },
    });

    server.register(cors, {
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });

    const memberRepo = new PostgresMemberRepository();
    const memberValidator = new MemberValidator(memberRepo);
    const paymentRepo = new PostgresPaymentRepository();
    const paymentValidator = new PaymentValidator();
    const medicalCertificateRepo = new PostgresMedicalCertificateRepository();
    const medicalCertificateValidator = new MedicalCertificateValidator();

    const createMemberUseCase = new CreateMemberUseCase(memberRepo, memberValidator);
    const getMembersUseCase = new GetMembersUseCase(memberRepo);
    const updateMemberUseCase = new UpdateMemberUseCase(memberRepo, memberValidator);
    const deleteMemberUseCase = new DeleteMemberUseCase(memberRepo);
    const createPaymentUseCase = new CreatePaymentUseCase(paymentRepo, memberRepo, paymentValidator);
    const updatePaymentUseCase = new UpdatePaymentUseCase(paymentRepo, paymentValidator);
    const markPaymentAsPaidUseCase = new MarkPaymentAsPaidUseCase(paymentRepo, paymentValidator);
    const cancelPaymentUseCase = new CancelPaymentUseCase(paymentRepo);
    const deletePaymentUseCase = new DeletePaymentUseCase(paymentRepo);
    const listPaymentsUseCase = new ListPaymentsUseCase(paymentRepo);
    const getPaymentByIdUseCase = new GetPaymentByIdUseCase(paymentRepo);
    const createMedicalCertificateUseCase = new CreateMedicalCertificateUseCase(
        medicalCertificateRepo,
        memberRepo,
        medicalCertificateValidator,
    );
    const listMedicalCertificatesUseCase = new ListMedicalCertificatesUseCase(medicalCertificateRepo);
    const getMedicalCertificateByIdUseCase = new GetMedicalCertificateByIdUseCase(
        medicalCertificateRepo,
    );
    const updateMedicalCertificateUseCase = new UpdateMedicalCertificateUseCase(
        medicalCertificateRepo,
        medicalCertificateValidator,
    );
    const invalidateMedicalCertificateUseCase = new InvalidateMedicalCertificateUseCase(
        medicalCertificateRepo,
    );
    const deleteMedicalCertificateUseCase = new DeleteMedicalCertificateUseCase(
        medicalCertificateRepo,
    );

    const memberController = new MemberController(
        createMemberUseCase,
        getMembersUseCase,
        updateMemberUseCase,
        deleteMemberUseCase
    );

    const paymentController = new PaymentController(
        createPaymentUseCase,
        updatePaymentUseCase,
        markPaymentAsPaidUseCase,
        cancelPaymentUseCase,
        deletePaymentUseCase,
        listPaymentsUseCase,
        getPaymentByIdUseCase,
    );

    const medicalCertificateController = new MedicalCertificateController(
        createMedicalCertificateUseCase,
        listMedicalCertificatesUseCase,
        getMedicalCertificateByIdUseCase,
        updateMedicalCertificateUseCase,
        invalidateMedicalCertificateUseCase,
        deleteMedicalCertificateUseCase,
    );

    server.get('/api/v1/socios', memberController.getAll.bind(memberController));
    server.post('/api/v1/socios', memberController.create.bind(memberController));
    server.put('/api/v1/socios/:id', memberController.update.bind(memberController));
    server.delete('/api/v1/socios/:id', memberController.delete.bind(memberController));
    server.get('/api/v1/payments', paymentController.getAll.bind(paymentController));
    server.get('/api/v1/payments/:id', paymentController.getById.bind(paymentController));
    server.post('/api/v1/payments', paymentController.create.bind(paymentController));
    server.patch('/api/v1/payments/:id', paymentController.update.bind(paymentController));
    server.patch('/api/v1/payments/:id/pay', paymentController.markAsPaid.bind(paymentController));
    server.patch('/api/v1/payments/:id/cancel', paymentController.cancel.bind(paymentController));
    server.delete('/api/v1/payments/:id', paymentController.delete.bind(paymentController));
    server.post('/api/v1/medical-certificates', medicalCertificateController.create.bind(medicalCertificateController));
    server.get('/api/v1/medical-certificates', medicalCertificateController.getAll.bind(medicalCertificateController));
    server.get('/api/v1/medical-certificates/:id', medicalCertificateController.getById.bind(medicalCertificateController));
    server.patch('/api/v1/medical-certificates/:id', medicalCertificateController.update.bind(medicalCertificateController));
    server.patch('/api/v1/medical-certificates/:id/invalidar', medicalCertificateController.invalidate.bind(medicalCertificateController));
    server.delete('/api/v1/medical-certificates/:id', medicalCertificateController.delete.bind(medicalCertificateController));

    server.get('/', async (req, rep) => {
        rep.status(200).send({ msg: 'asd' })
    });

    // ==========================================
    // Dependencias y Rutas de Locker
    // ==========================================
    const lockerRepo = new PostgresLockerRepository();
    const createLockerUseCase = new CreateLockerUseCase(lockerRepo);
    const updateLockerUseCase = new UpdateLockerUseCase(lockerRepo);
    const deleteLockerUseCase = new DeleteLockerUseCase(lockerRepo);
    const listLockersUseCase = new ListLockersUseCase(lockerRepo);
    const getLockerByNumberUseCase = new GetLockerByNumberUseCase(lockerRepo);

    const lockerController = new LockerController(
        createLockerUseCase,
        updateLockerUseCase,
        deleteLockerUseCase,
        listLockersUseCase,
        getLockerByNumberUseCase
    );

    server.post('/api/v1/lockers', lockerController.create.bind(lockerController));
    server.patch('/api/v1/lockers/:number', lockerController.update.bind(lockerController));
    server.delete('/api/v1/lockers/:number', lockerController.delete.bind(lockerController));
    server.get('/api/v1/lockers', lockerController.list.bind(lockerController));
    server.get('/api/v1/lockers/:number', lockerController.getByNumber.bind(lockerController));

    // ==========================================
    // Dependencias y rutas de Sport
    // ==========================================
    const sportRepo = new PostgresSportRepository();
    const sportValidator = new SportValidator(sportRepo);
    const createSportUseCase = new CreateSportUseCase(sportRepo, sportValidator);
    const updateSportUseCase = new UpdateSportUseCase(sportRepo, sportValidator);
    const deleteSportUseCase = new DeleteSportUseCase(sportRepo);
    const listSportsUseCase = new ListSportsUseCase(sportRepo);
    const getSportByIdUseCase = new GetSportByIdUseCase(sportRepo);

    const sportController = new SportController(
        createSportUseCase,
        updateSportUseCase,
        deleteSportUseCase,
        listSportsUseCase,
        getSportByIdUseCase
    );

    server.post('/api/v1/sports', sportController.create.bind(sportController));
    server.patch('/api/v1/sports/:id', sportController.update.bind(sportController));
    server.delete('/api/v1/sports/:id', sportController.delete.bind(sportController));
    server.get('/api/v1/sports', sportController.listAll.bind(sportController));
    server.get('/api/v1/sports/:id', sportController.getById.bind(sportController));

    // ==========================================
    // Dependencias y rutas de Discipline
    // ==========================================
    const disciplineRepo = new PostgresDisciplineRepository();
    const disciplineValidator = new DisciplineValidator();
    
    // Instanciamos los casos de uso
    const createDisciplineUseCase = new CreateDisciplineUseCase(disciplineRepo, disciplineValidator);
    const listDisciplinesUseCase = new ListDisciplinesUseCase(disciplineRepo); 
    const getDisciplineByIdUseCase = new GetDisciplineByIdUseCase(disciplineRepo);
    const deleteDisciplineUseCase = new DeleteDisciplineUseCase(disciplineRepo); 

    // Pasamos el nuevo caso de uso al controlador
    const disciplineController = new DisciplineController(
        createDisciplineUseCase,
        listDisciplinesUseCase,
        getDisciplineByIdUseCase,
        deleteDisciplineUseCase 
    );

    // Endpoints de Disciplinas
    server.post('/api/v1/disciplines', disciplineController.create.bind(disciplineController));
    server.get('/api/v1/disciplines', disciplineController.getAll.bind(disciplineController)); 
    server.get('/api/v1/disciplines/:id', disciplineController.getById.bind(disciplineController)); 
    server.delete('/api/v1/disciplines/:id', disciplineController.delete.bind(disciplineController)); 

    return server;
}


if (process.argv[1] && process.argv[1].endsWith('app.ts')) {
    const server = buildApp();
    const port = parseInt(process.env.PORT || '3000', 10);

    server.listen({ port, host: '0.0.0.0' }, () =>
        server.log.info(`API server running on http://localhost:${port}`)
    );

    ['SIGINT', 'SIGTERM'].forEach((signal) => {
        process.on(signal, async () => {
            await server.close();
            process.exit(0);
        });
    });
}