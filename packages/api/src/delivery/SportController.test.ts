import { describe, it, expect, vi, beforeEach } from "vitest";
import { SportController } from "./SportController.js";

describe('SportController', () => {
    const mockCreateSportUseCase = { execute: vi.fn() }
    const mockUpdateSportUseCase = { execute: vi.fn() }
    const mockGetSportUseCase = { execute: vi.fn() }
    const mockListSportUseCase = { execute: vi.fn() }
    const mockDeleteSportUseCase = { execute: vi.fn() }

    const controller = new SportController(
        mockCreateSportUseCase as any,
        mockUpdateSportUseCase as any,
        mockDeleteSportUseCase as any,
        mockListSportUseCase as any,
        mockGetSportUseCase as any,
    )

    const mockRequest = {
        log: { info: vi.fn() },
        body: { name: 'Futbol' },
        params: { id: '1' },
    }

    const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn()
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('create', () => {
        it('debe devolver status 201 y los datos si la creación es exitosa', async () => {
            const mockSport = { id: '1', name: 'Futbol' }
            mockCreateSportUseCase.execute.mockResolvedValueOnce(mockSport)
            await controller.create(mockRequest as any, mockReply as any)
            expect(mockCreateSportUseCase.execute).toHaveBeenCalledWith({ name: 'Futbol' })
            expect(mockReply.status).toHaveBeenCalledWith(201)
            expect(mockReply.send).toHaveBeenCalledWith({ data: mockSport })
        })

        it('debe devolver status 500 ante un error genérico', async () => {
            mockCreateSportUseCase.execute.mockRejectedValueOnce(new Error('Generic failure'))
            await controller.create(mockRequest as any, mockReply as any)
            expect(mockReply.status).toHaveBeenCalledWith(500)
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Error interno, reintente más tarde' })
        })
    })

    describe('update', () => {
        it('debe devolver status 200 y los datos si la actualización es exitosa', async () => {
            const mockSport = { id: '1', name: 'Futbol' }
            mockUpdateSportUseCase.execute.mockResolvedValueOnce(mockSport)
            await controller.update(mockRequest as any, mockReply as any)
            expect(mockUpdateSportUseCase.execute).toHaveBeenCalledWith("1", { name: "Futbol" })
            expect(mockReply.status).toHaveBeenCalledWith(200)
            expect(mockReply.send).toHaveBeenCalledWith({ data: mockSport })
        })

        it('debe devolver status 500 ante un error genérico', async () => {
            mockUpdateSportUseCase.execute.mockRejectedValueOnce(new Error('Generic failure'))
            await controller.update(mockRequest as any, mockReply as any)
            expect(mockReply.status).toHaveBeenCalledWith(500)
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Error interno, reintente más tarde' })
        })
    })

    describe('listAll', () => {
        it('debe devolver status 200 y la lista de deportes', async () => {
            const mockSports = [{ id: '1', name: 'Futbol' }, { id: '2', name: 'Basquet' }]
            mockListSportUseCase.execute.mockResolvedValueOnce(mockSports)
            await controller.listAll(mockRequest as any, mockReply as any)
            expect(mockListSportUseCase.execute).toHaveBeenCalledWith()
            expect(mockReply.status).toHaveBeenCalledWith(200)
            expect(mockReply.send).toHaveBeenCalledWith({ data: mockSports })
        })

        it('debe devolver status 500 ante un error genérico', async () => {
            mockListSportUseCase.execute.mockRejectedValueOnce(new Error('Generic failure'))
            await controller.listAll(mockRequest as any, mockReply as any)
            expect(mockReply.status).toHaveBeenCalledWith(500)
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Error interno, reintente más tarde' })
        })
    })

    describe('getById', () => {
        it('debe devolver status 200 y los datos si la obtención es exitosa', async () => {
            const mockSport = { id: '1', name: 'Futbol' }
            mockGetSportUseCase.execute.mockResolvedValueOnce(mockSport)
            await controller.getById(mockRequest as any, mockReply as any)
            expect(mockGetSportUseCase.execute).toHaveBeenCalledWith("1")
            expect(mockReply.status).toHaveBeenCalledWith(200)
            expect(mockReply.send).toHaveBeenCalledWith({ data: mockSport })
        })

        it('debe devolver status 500 ante un error genérico', async () => {
            mockGetSportUseCase.execute.mockRejectedValueOnce(new Error('Generic failure'))
            await controller.getById(mockRequest as any, mockReply as any)
            expect(mockReply.status).toHaveBeenCalledWith(500)
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Error interno, reintente más tarde' })
        })
    })

    describe('delete', () => {
        it('debe devolver status 200 si la eliminación es exitosa', async () => {
            mockDeleteSportUseCase.execute.mockResolvedValueOnce(undefined)
            await controller.delete(mockRequest as any, mockReply as any)
            expect(mockDeleteSportUseCase.execute).toHaveBeenCalledWith("1")
            expect(mockReply.status).toHaveBeenCalledWith(200)
            expect(mockReply.send).toHaveBeenCalledWith({ data: "Deporte eliminado correctamente" })
        })

        it('debe devolver status 500 ante un error genérico', async () => {
            mockDeleteSportUseCase.execute.mockRejectedValueOnce(new Error('Generic failure'))
            await controller.delete(mockRequest as any, mockReply as any)
            expect(mockReply.status).toHaveBeenCalledWith(500)
            expect(mockReply.send).toHaveBeenCalledWith({ error: 'Error interno, reintente más tarde' })
        })
    })
})