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
import { PostgresLockerRepository } from './infrastructure/PostgresLockerRepository.js'; // Ajustar si es otra carpeta
import { CreateLockerUseCase } from './application/LockerUseCases/NewLockerUseCase.js';
import { UpdateLockerUseCase } from './application/LockerUseCases/UpdateLockerUseCase.js';
import { DeleteLockerUseCase } from './application/LockerUseCases/DeleteLockerUseCase.js';
import { ListLockersUseCase } from './application/LockerUseCases/ListLockersUseCase.js';
import { GetLockerByNumberUseCase } from './application/LockerUseCases/GetLockerByNumberUseCase.js';
import { LockerController } from './delivery/LockerController.js'; // O donde lo hayas guardado
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
import { PostgresMedicalCertificateRepository } from './infrastructure/PostgresMedicalCertificateRepository.js';
import { CreateMedicalCertificateUseCase } from './application/MedicalCertificateUseCases/CreateMedicalCertificateUseCase.js';
import { ListMedicalCertificatesUseCase } from './application/MedicalCertificateUseCases/ListMedicalCertificatesUseCase.js';
import { GetMedicalCertificateByIdUseCase } from './application/MedicalCertificateUseCases/GetMedicalCertificateByIdUseCase.js';
import { MedicalCertificateController } from './delivery/MedicalCertificateController.js';


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
        methods: ['GET', 'POST', 'PUT','PATCH', 'DELETE', 'OPTIONS'],

        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });

    const memberRepo = new PostgresMemberRepository();
    const memberValidator = new MemberValidator(memberRepo);
    const paymentRepo = new PostgresPaymentRepository();
    const paymentValidator = new PaymentValidator();
    const medicalCertificateRepo = new PostgresMedicalCertificateRepository();
    
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
    const createMedicalCertificateUseCase = new CreateMedicalCertificateUseCase(medicalCertificateRepo);
    const listMedicalCertificatesUseCase = new ListMedicalCertificatesUseCase(medicalCertificateRepo);
    const getMedicalCertificateByIdUseCase = new GetMedicalCertificateByIdUseCase(medicalCertificateRepo);

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

    server.get('/', async (req, rep) => {
        rep.status(200).send({ msg: 'asd' })
    });


   // ==========================================
    // Dependencias y Rutas de Locker
    // ==========================================
    
    // 1. Instanciamos el repositorio (Infraestructura)
    const lockerRepo = new PostgresLockerRepository();
    
    // 2. Instanciamos los Casos de Uso (Aplicación) pasándoles el repositorio
    const createLockerUseCase = new CreateLockerUseCase(lockerRepo);
    const updateLockerUseCase = new UpdateLockerUseCase(lockerRepo);
    const deleteLockerUseCase = new DeleteLockerUseCase(lockerRepo);
    const listLockersUseCase = new ListLockersUseCase(lockerRepo);
    const getLockerByNumberUseCase = new GetLockerByNumberUseCase(lockerRepo);

    // 3. Instanciamos el Controlador (Delivery/Entrada) pasándole los Casos de Uso
    const lockerController = new LockerController(
        createLockerUseCase,
        updateLockerUseCase,
        deleteLockerUseCase,
        listLockersUseCase,
        getLockerByNumberUseCase
    );

    // 4. Registramos las rutas de Fastify según los TDDs
    server.post('/api/v1/lockers', lockerController.create.bind(lockerController));
    server.patch('/api/v1/lockers/:number', lockerController.update.bind(lockerController));
    server.delete('/api/v1/lockers/:number', lockerController.delete.bind(lockerController));
    server.get('/api/v1/lockers', lockerController.list.bind(lockerController));
    server.get('/api/v1/lockers/:number', lockerController.getByNumber.bind(lockerController));


    return server;

   
    
}

// Solo iniciar el servidor si el script se ejecuta directamente (no cuando es importado por vitest)
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